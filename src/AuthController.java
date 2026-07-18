package com.eclass.p2k.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Value("${google.client.id}")
    private String googleClientId;

    @Autowired
    private DataSource dataSource;

    // Secret key nạp động từ config (fallback về khóa mặc định dài nếu chưa cấu hình)
    @Value("${jwt.secret:eclass_p2k_secure_default_secret_key_change_me_at_least_32_bytes}")
    private String jwtSecret;

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> request) {
        String idTokenString = request.get("idToken");
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Mã xác thực Google ID Token là bắt buộc."));
        }

        try {
            // 1. Xác thực Google ID Token
            NetHttpTransport transport = new NetHttpTransport();
            GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Google ID Token không hợp lệ hoặc đã hết hạn."));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            
            // Đảm bảo email đã được xác minh bởi Google
            if (!payload.getEmailVerified()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Tài khoản Google này chưa được xác minh email."));
            }

            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // 2. Tra cứu cơ sở dữ liệu để tìm người dùng & phân quyền dựa trên Email
            Map<String, Object> userInfo = findUserByEmail(email);

            if (userInfo == null) {
                // Email này chưa được đăng ký trong Database
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Tài khoản email (" + email + ") chưa được đăng ký trên hệ thống E-Class P2K. Vui lòng liên hệ Admin."));
            }

            // Đồng bộ/cập nhật ảnh đại diện từ Google nếu DB chưa có
            if (userInfo.get("photo") == null || userInfo.get("photo").toString().trim().isEmpty()) {
                updateUserPhoto(userInfo.get("id").toString(), userInfo.get("role").toString(), pictureUrl);
                userInfo.put("photo", pictureUrl);
            }

            // 3. Sinh JWT Token hệ thống giả lập
            String systemJwtToken = generateSystemJwt(userInfo.get("id").toString(), userInfo.get("role").toString(), email);

            // 4. Trả về phản hồi đăng nhập thành công
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", systemJwtToken);
            responseData.put("user", userInfo);

            return ResponseEntity.ok(responseData);

        } catch (GeneralSecurityException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi hệ thống khi xác thực Google API: " + e.getMessage()));
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Lỗi truy vấn cơ sở dữ liệu: " + e.getMessage()));
        }
    }

    /**
     * Tra cứu người dùng trong Database theo email ở các bảng teachers, students, parents để phân quyền.
     */
    private Map<String, Object> findUserByEmail(String email) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            
            // 1. Kiểm tra bảng giáo viên (Teachers)
            String teacherSql = "SELECT id, name, subject, photo, emoji, is_admin FROM teachers WHERE email = ?";
            try (PreparedStatement stmt = conn.prepareStatement(teacherSql)) {
                stmt.setString(1, email);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> user = new HashMap<>();
                        user.put("id", rs.getString("id"));
                        user.put("name", rs.getString("name"));
                        user.put("email", email);
                        user.put("photo", rs.getString("photo"));
                        user.put("emoji", rs.getString("emoji") != null ? rs.getString("emoji") : "👨‍🏫");

                        // Phân biệt: Admin, Proctor, Teacher
                        boolean isAdmin = rs.getBoolean("is_admin");
                        String subject = rs.getString("subject");
                        if (isAdmin) {
                            user.put("role", "admin");
                        } else if ("Quản sinh".equalsIgnoreCase(subject)) {
                            user.put("role", "proctor");
                        } else {
                            user.put("role", "teacher");
                        }
                        return user;
                    }
                }
            }

            // 2. Kiểm tra bảng học sinh (Students)
            String studentSql = "SELECT id, name, photo, emoji FROM students WHERE email = ?";
            try (PreparedStatement stmt = conn.prepareStatement(studentSql)) {
                stmt.setString(1, email);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> user = new HashMap<>();
                        user.put("id", rs.getString("id"));
                        user.put("name", rs.getString("name"));
                        user.put("email", email);
                        user.put("role", "student");
                        user.put("photo", rs.getString("photo"));
                        user.put("emoji", rs.getString("emoji") != null ? rs.getString("emoji") : "😊");
                        return user;
                    }
                }
            }

            // 3. Kiểm tra bảng phụ huynh (Parents)
            String parentSql = "SELECT id, name, email FROM parents WHERE email = ?";
            try (PreparedStatement stmt = conn.prepareStatement(parentSql)) {
                stmt.setString(1, email);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        Map<String, Object> user = new HashMap<>();
                        user.put("id", rs.getString("id"));
                        user.put("name", rs.getString("name"));
                        user.put("email", email);
                        user.put("role", "parent");
                        user.put("photo", null); // Phụ huynh có thể không có ảnh avatar lưu trong DB
                        user.put("emoji", "👪");
                        return user;
                    }
                }
            }
        }
        return null; // Không tìm thấy email này ở bất cứ bảng nào
    }

    /**
     * Cập nhật ảnh đại diện của người dùng từ Google Profile nếu cơ sở dữ liệu đang trống.
     */
    private void updateUserPhoto(String userId, String role, String photoUrl) throws SQLException {
        String tableName = "";
        if ("teacher".equals(role) || "proctor".equals(role) || "admin".equals(role)) {
            tableName = "teachers";
        } else if ("student".equals(role)) {
            tableName = "students";
        } else {
            return; // Parent tạm thời không cập nhật photo hoặc lưu trữ riêng
        }

        String sql = "UPDATE " + tableName + " SET photo = ? WHERE id = ? AND (photo IS NULL OR photo = '')";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, photoUrl);
            stmt.setString(2, userId);
            stmt.executeUpdate();
        }
    }

    /**
     * Sinh mã JWT giả lập của hệ thống chứa thông tin Identity để trả về Client.
     */
    private String generateSystemJwt(String userId, String role, String email) {
        // Trong dự án thực tế, sử dụng thư viện như io.jsonwebtoken (jjwt) để sinh JWT:
        // return Jwts.builder()
        //         .setSubject(userId)
        //         .claim("role", role)
        //         .claim("email", email)
        //         .signWith(SignatureAlgorithm.HS256, jwtSecret.getBytes())
        //         .compact();
        
        long expiryTime = System.currentTimeMillis() + (7 * 24 * 60 * 60 * 1000); // 7 ngày
        return "eclass_jwt." + Base64UrlEncode(userId) + "." + Base64UrlEncode(role) + "." + expiryTime;
    }

    private String Base64UrlEncode(String input) {
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(input.getBytes());
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> err = new HashMap<>();
        err.put("message", message);
        return err;
    }
}
