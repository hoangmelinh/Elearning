package com.elearning.progress;

import com.elearning.user.User;
import com.elearning.listening.UserAttemptRepository;
import com.elearning.listening.UserAttempt;
import com.elearning.writing.WritingSubmissionRepository;
import com.elearning.writing.WritingSubmission;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningProgressService {

    private final LearningProgressRepository progressRepository;
    private final UserAttemptRepository attemptRepository;
    private final WritingSubmissionRepository writingRepository;

    public LearningProgress getProgress(User user) {
        return progressRepository.findByUserId(user.getId())
                .orElseGet(() -> createDefaultProgress(user));
    }

    private LearningProgress createDefaultProgress(User user) {
        LearningProgress progress = new LearningProgress();
        progress.setUser(user);
        return progressRepository.save(progress);
    }

    public void logActivity(User user) {
        LearningProgress progress = getProgress(user);
        ZonedDateTime now = ZonedDateTime.now();

        if (progress.getLastActivityDate() == null) {
            progress.setStreakDays(1);
        } else {
            long hoursSinceLastActivity = ChronoUnit.HOURS.between(progress.getLastActivityDate(), now);
            if (hoursSinceLastActivity > 24 && hoursSinceLastActivity <= 48) {
                // Next day, increment streak
                progress.setStreakDays(progress.getStreakDays() + 1);
            } else if (hoursSinceLastActivity > 48) {
                // Missed a day, reset streak
                progress.setStreakDays(1);
            }
            // If < 24 hours, do nothing (same day)
        }

        progress.setLastActivityDate(now);
        progressRepository.save(progress);
    }

    public void incrementExercisesCompleted(User user) {
        LearningProgress progress = getProgress(user);
        progress.setTotalExercisesCompleted(progress.getTotalExercisesCompleted() + 1);
        progressRepository.save(progress);
        logActivity(user);
    }

    public void incrementFlashcardsMastered(User user) {
        LearningProgress progress = getProgress(user);
        progress.setTotalFlashcardsMastered(progress.getTotalFlashcardsMastered() + 1);
        progressRepository.save(progress);
        logActivity(user);
    }

    public Map<String, Object> getAggregatedHistory(User user) {
        Map<String, Object> history = new HashMap<>();

        // Fetch recent exercises
        List<UserAttempt> exercises = attemptRepository.findByUserId(user.getId(), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "completedAt"))).getContent();
        
        // Fetch recent writing
        List<WritingSubmission> writings = writingRepository.findByUserId(user.getId(), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "submittedAt"))).getContent();

        // Simplify output for frontend
        List<Map<String, Object>> mappedExercises = exercises.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("title", a.getExercise().getTitle());
            map.put("type", a.getExercise().getSkillType());
            map.put("score", a.getScore());
            map.put("date", a.getCompletedAt());
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> mappedWritings = writings.stream().map(w -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", w.getId());
            map.put("title", w.getPrompt().getTitle());
            map.put("type", "writing");
            map.put("status", w.getStatus());
            map.put("date", w.getSubmittedAt());
            return map;
        }).collect(Collectors.toList());

        history.put("exercises", mappedExercises);
        history.put("writings", mappedWritings);

        return history;
    }
}
