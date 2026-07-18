package com.elearning.listening;

import com.elearning.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAttemptService {

    private final UserAttemptRepository attemptRepository;
    private final UserAnswerRepository answerRepository;
    private final ExerciseRepository exerciseRepository;

    public List<UserAttempt> getUserAttempts(User user, UUID exerciseId) {
        return attemptRepository.findByUserIdAndExerciseIdOrderByStartedAtDesc(user.getId(), exerciseId);
    }

    @Transactional
    public UserAttempt submitAttempt(User user, UUID exerciseId, List<UserAnswer> answers, BigDecimal score, ZonedDateTime startedAt) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new IllegalArgumentException("Exercise not found"));

        UserAttempt attempt = new UserAttempt();
        attempt.setUser(user);
        attempt.setExercise(exercise);
        attempt.setScore(score);
        attempt.setStartedAt(startedAt);
        attempt.setCompletedAt(ZonedDateTime.now());

        attempt = attemptRepository.save(attempt);

        for (UserAnswer ans : answers) {
            ans.setAttempt(attempt);
        }
        answerRepository.saveAll(answers);

        return attempt;
    }
}
