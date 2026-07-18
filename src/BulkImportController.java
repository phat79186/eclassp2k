package com.eclass.p2k.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.*;

@RestController
@RequestMapping("/api/admin/import")
@CrossOrigin(origins = "*")
public class BulkImportController {

    @Autowired
    private DataSource dataSource;

    /**
     * Nhập số lượng lớn Trường học bằng Batch Insert (JSON payload từ client đã qua Preview)
     */
    @PostMapping("/schools")
    public ResponseEntity<?> importSchools(@RequestBody List<Map<String, String>> schoolList) {
        if (schoolList == null || schoolList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createResponseMap("message", "Danh sách trường học rỗng."));
        }

        String sql = "INSERT INTO schools (name) VALUES (?) ON CONFLICT (name) DO NOTHING";
        Connection conn = null;
        PreparedStatement stmt = null;
        int importedCount = 0;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false); // Quản lý Transaction thủ công để batch insert an toàn
            stmt = conn.prepareStatement(sql);

            for (Map<String, String> school : schoolList) {
                String name = school.get("name");
                if (name == null || name.trim().isEmpty()) {
                    continue; // Bỏ qua dòng rỗng hoặc không có tên
                }
                stmt.setString(1, name.trim());
                stmt.addBatch();
            }

            int[] results = stmt.executeBatch();
            conn.commit(); // Hoàn tất Transaction

            // Tính toán số lượng bản ghi thực tế được insert thành công
            for (int res : results) {
                if (res >= 0 || res == PreparedStatement.SUCCESS_NO_INFO) {
                    importedCount++;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đã nhập thành công danh sách trường học.");
            response.put("importedCount", importedCount);
            return ResponseEntity.ok(response);

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback(); // Rollback nếu gặp lỗi
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponseMap("message", "Lỗi cơ sở dữ liệu: " + e.getMessage()));
        } finally {
            closeResources(stmt, conn);
        }
    }

    /**
     * Nhập số lượng lớn Giáo viên bằng Batch Insert
     */
    @PostMapping("/teachers")
    public ResponseEntity<?> importTeachers(@RequestBody List<Map<String, String>> teacherList) {
        if (teacherList == null || teacherList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createResponseMap("message", "Danh sách giáo viên rỗng."));
        }

        String sql = "INSERT INTO teachers (id, name, username, password_hash, subject, school, email, emoji, is_admin, email_verified) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON CONFLICT (username) DO NOTHING";

        Connection conn = null;
        PreparedStatement stmt = null;
        int importedCount = 0;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);
            stmt = conn.prepareStatement(sql);

            long baseTimestamp = System.currentTimeMillis();
            int counter = 0;

            for (Map<String, String> teacher : teacherList) {
                String name = teacher.get("name");
                String username = teacher.get("username");
                String password = teacher.get("password");
                String subject = teacher.get("subject");
                String school = teacher.get("school");
                String email = teacher.get("email");

                // Kiểm tra ràng buộc bắt buộc
                if (name == null || name.trim().isEmpty() ||
                    username == null || username.trim().isEmpty() ||
                    password == null || password.trim().isEmpty() ||
                    subject == null || subject.trim().isEmpty() ||
                    school == null || school.trim().isEmpty() ||
                    email == null || email.trim().isEmpty()) {
                    continue; // Bỏ qua bản ghi không hợp lệ
                }

                // Sinh ID duy nhất cho giáo viên
                String teacherId = "t_" + baseTimestamp + "_" + (1000 + counter++) + "_" + UUID.randomUUID().toString().substring(0, 4);

                stmt.setString(1, teacherId);
                stmt.setString(2, name.trim());
                stmt.setString(3, username.trim().toLowerCase());
                stmt.setString(4, password.trim()); // Lưu trực tiếp mật khẩu theo cơ chế hiện tại của DB
                stmt.setString(5, subject.trim());
                stmt.setString(6, school.trim());
                stmt.setString(7, email.trim());
                stmt.setString(8, "👨‍🏫"); // Emoji mặc định
                stmt.setBoolean(9, false); // Không phải Admin
                stmt.setBoolean(10, true); // Email_verified mặc định cho bản ghi import sẵn

                stmt.addBatch();
            }

            int[] results = stmt.executeBatch();
            conn.commit();

            for (int res : results) {
                if (res >= 0 || res == PreparedStatement.SUCCESS_NO_INFO) {
                    importedCount++;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đã nhập thành công danh sách giáo viên.");
            response.put("importedCount", importedCount);
            return ResponseEntity.ok(response);

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createResponseMap("message", "Lỗi cơ sở dữ liệu khi nhập giáo viên: " + e.getMessage()));
        } finally {
            closeResources(stmt, conn);
        }
    }

    private void closeResources(PreparedStatement stmt, Connection conn) {
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    private Map<String, String> createResponseMap(String key, String value) {
        Map<String, String> map = new HashMap<>();
        map.put(key, value);
        return map;
    }
}
