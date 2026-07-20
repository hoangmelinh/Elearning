import java.sql.*;

public class CheckDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/elearning_db";
        String user = "postgres";
        String password = "password"; // wait, the prompt says POSTGRES_PASSWORD='123456'

        try (Connection conn = DriverManager.getConnection(url, user, "123456");
             Statement stmt = conn.createStatement()) {
            
            stmt.executeUpdate("ALTER TABLE writing_prompts DROP COLUMN description");
            System.out.println("Dropped column description successfully!");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
