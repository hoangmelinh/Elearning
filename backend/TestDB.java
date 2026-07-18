import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class TestDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/elearning_db", "postgres", "123456");
            PreparedStatement pstmt = conn.prepareStatement("select * from users where email=?");
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
