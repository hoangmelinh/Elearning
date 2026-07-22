import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class FixCheckConstraint {
    public static void main(String[] args) {
        try {
            System.out.println("Connecting to PostgreSQL elearning_db...");
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/elearning_db", "postgres", "123456");
            Statement stmt = conn.createStatement();
            
            System.out.println("Dropping old constraint chk_exercise_source...");
            stmt.execute("ALTER TABLE exercises DROP CONSTRAINT IF EXISTS chk_exercise_source;");
            
            System.out.println("Adding updated constraint chk_exercise_source allowing 'speaking'...");
            stmt.execute("ALTER TABLE exercises ADD CONSTRAINT chk_exercise_source CHECK ((skill_type = 'reading' AND passage_text IS NOT NULL) OR (skill_type = 'listening' AND video_id IS NOT NULL) OR (skill_type = 'speaking'));");
            
            System.out.println("SUCCESS: Constraint chk_exercise_source updated successfully for speaking exercises!");
            
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
