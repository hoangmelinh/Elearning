import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class AlterEnumDB {
    public static void main(String[] args) {
        try {
            System.out.println("Connecting to PostgreSQL elearning_db...");
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/elearning_db", "postgres", "123456");
            Statement stmt = conn.createStatement();
            
            System.out.println("Executing ALTER TYPE exercise_skill_type ADD VALUE IF NOT EXISTS 'speaking'...");
            stmt.execute("ALTER TYPE exercise_skill_type ADD VALUE IF NOT EXISTS 'speaking';");
            System.out.println("SUCCESS: PostgreSQL enum 'exercise_skill_type' updated with 'speaking'!");
            
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
