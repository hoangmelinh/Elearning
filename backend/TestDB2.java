import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class TestDB2 {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/elearning_db", "postgres", "123456");
            String sql = "select u1_0.id, u1_0.avatar_url, u1_0.created_at, u1_0.email, u1_0.full_name, u1_0.password_hash, u1_0.phone, u1_0.primary_learning_language, u1_0.role, u1_0.status, u1_0.updated_at from users u1_0 where u1_0.email=?";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, "hoangk91234@gmail.com");
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                System.out.println("Success: " + rs.getString("email"));
            } else {
                System.out.println("No user found.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
