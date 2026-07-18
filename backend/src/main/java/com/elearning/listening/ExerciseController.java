package com.elearning.listening;

import com.elearning.common.ApiResponse;
import com.elearning.common.ContentLanguage;
import com.elearning.common.ExerciseSkillType;
import com.elearning.common.PagedResponse;
import com.elearning.listening.dto.AttemptSubmissionRequest;
import com.elearning.listening.dto.UserAnswerRequest;
import com.elearning.user.User;
import com.elearning.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;
    private final UserAttemptService attemptService;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserAttemptRepository userAttemptRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final VideoRepository videoRepository;
    private final com.elearning.ai.ExerciseAiService exerciseAiService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<Exercise>>> getExercises(
            @RequestParam(required = false) ExerciseSkillType skillType,
            @RequestParam(required = false) ContentLanguage language,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<Exercise> exercises = exerciseService.getExercises(skillType, language, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(exercises)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> generateExercise(
            @RequestParam String topic,
            @RequestParam String level,
            @RequestParam String language
    ) {
        java.util.Map<String, Object> generated = exerciseAiService.generateExercise(topic, level, language);
        return ResponseEntity.ok(ApiResponse.success("Generated exercise", generated));
    }

    @PostMapping("/full")
    public ResponseEntity<ApiResponse<Exercise>> createFullExercise(
            @RequestBody com.elearning.listening.dto.FullExerciseRequest request
    ) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        com.elearning.user.User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        Exercise exercise = new Exercise();
        exercise.setTitle(request.getTitle());
        exercise.setLanguage(request.getLanguage());
        exercise.setLevel(request.getLevel());
        exercise.setSkillType(request.getSkillType() != null ? request.getSkillType() : ExerciseSkillType.reading);
        if (request.getPassageText() != null) {
            exercise.setPassageText(request.getPassageText());
        }

        if (ExerciseSkillType.listening.equals(exercise.getSkillType()) && request.getYoutubeUrl() != null && !request.getYoutubeUrl().isEmpty()) {
            Video video = new Video();
            video.setTitle(request.getTitle() + " Video");
            video.setLanguage(request.getLanguage());
            video.setSourceType("youtube");
            video.setVideoUrl(request.getYoutubeUrl());
            video.setCreatedBy(user);
            video = videoRepository.save(video);
            exercise.setVideo(video);
        }

        exercise = exerciseRepository.save(exercise);

        // Persist questions + options
        if (request.getQuestions() != null) {
            for (var qPayload : request.getQuestions()) {
                Question q = new Question();
                q.setExercise(exercise);
                q.setQuestionText(qPayload.getQuestionText());
                q.setQuestionType(qPayload.getQuestionType());
                q.setOrderIndex(qPayload.getOrderIndex());
                if ("fill_blank".equals(qPayload.getQuestionType())) {
                    q.setCorrectAnswerText(qPayload.getCorrectAnswerText());
                }
                q = questionRepository.save(q);

                if ("multiple_choice".equals(qPayload.getQuestionType()) && qPayload.getOptions() != null) {
                    for (var optPayload : qPayload.getOptions()) {
                        AnswerOption opt = new AnswerOption();
                        opt.setQuestion(q);
                        opt.setOptionText(optPayload.getOptionText());
                        opt.setCorrect(optPayload.isCorrect());
                        answerOptionRepository.save(opt);
                    }
                }
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exercise created", exercise));
    }

    @PutMapping("/full/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Exercise>> updateFullExercise(
            @PathVariable UUID id,
            @RequestBody com.elearning.listening.dto.FullExerciseRequest request
    ) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        com.elearning.user.User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exercise not found: " + id));

        exercise.setTitle(request.getTitle());
        exercise.setLanguage(request.getLanguage());
        exercise.setLevel(request.getLevel());
        exercise.setSkillType(request.getSkillType() != null ? request.getSkillType() : ExerciseSkillType.reading);
        if (request.getPassageText() != null) {
            exercise.setPassageText(request.getPassageText());
        }

        if (ExerciseSkillType.listening.equals(exercise.getSkillType()) && request.getYoutubeUrl() != null && !request.getYoutubeUrl().isEmpty()) {
            Video video = exercise.getVideo();
            if (video == null) {
                video = new Video();
                video.setCreatedBy(user);
                video.setSourceType("youtube");
            }
            video.setTitle(request.getTitle() + " Video");
            video.setLanguage(request.getLanguage());
            video.setVideoUrl(request.getYoutubeUrl());
            video = videoRepository.save(video);
            exercise.setVideo(video);
        } else if (ExerciseSkillType.reading.equals(exercise.getSkillType())) {
            if (exercise.getVideo() != null) {
                Video oldVideo = exercise.getVideo();
                exercise.setVideo(null);
                videoRepository.delete(oldVideo);
            }
        }

        exercise = exerciseRepository.save(exercise);

        // Clear existing attempts and answers to prevent FK constraint violations
        List<com.elearning.listening.UserAttempt> attempts = userAttemptRepository.findByExerciseId(id);
        for (com.elearning.listening.UserAttempt attempt : attempts) {
            userAnswerRepository.deleteAll(userAnswerRepository.findByAttemptId(attempt.getId()));
        }
        userAttemptRepository.deleteAll(attempts);

        // Clear existing questions and options
        List<Question> existingQuestions = exerciseService.getQuestionsForExercise(id);
        for (Question q : existingQuestions) {
            answerOptionRepository.deleteAll(answerOptionRepository.findByQuestionId(q.getId()));
            questionRepository.delete(q);
        }

        // Persist new questions + options
        if (request.getQuestions() != null) {
            for (var qPayload : request.getQuestions()) {
                Question q = new Question();
                q.setExercise(exercise);
                q.setQuestionText(qPayload.getQuestionText());
                q.setQuestionType(qPayload.getQuestionType());
                q.setOrderIndex(qPayload.getOrderIndex());
                if ("fill_blank".equals(qPayload.getQuestionType())) {
                    q.setCorrectAnswerText(qPayload.getCorrectAnswerText());
                }
                q = questionRepository.save(q);

                if ("multiple_choice".equals(qPayload.getQuestionType()) && qPayload.getOptions() != null) {
                    for (var optPayload : qPayload.getOptions()) {
                        AnswerOption opt = new AnswerOption();
                        opt.setQuestion(q);
                        opt.setOptionText(optPayload.getOptionText());
                        opt.setCorrect(optPayload.isCorrect());
                        answerOptionRepository.save(opt);
                    }
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Exercise updated", exercise));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExercise(@PathVariable UUID id) {
        exerciseRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Exercise not found: " + id));
        // Cascade deletes questions → options → attempts via DB FK ON DELETE CASCADE (or we do it manually)
        List<Question> questions = exerciseService.getQuestionsForExercise(id);
        for (Question q : questions) {
            answerOptionRepository.deleteAll(answerOptionRepository.findByQuestionId(q.getId()));
            questionRepository.delete(q);
        }
        exerciseRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Exercise deleted", null));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Exercise>> createExercise(
            @RequestBody com.elearning.listening.dto.ExerciseRequest request
    ) {
        Exercise exercise = new Exercise();
        exercise.setTitle(request.getTitle());
        exercise.setLanguage(request.getLanguage());
        exercise.setLevel(request.getLevel());
        exercise.setSkillType(request.getSkillType() != null ? request.getSkillType() : ExerciseSkillType.reading);
        if (request.getPassageText() != null) {
            exercise.setPassageText(request.getPassageText());
        }
        Exercise saved = exerciseRepository.save(exercise);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exercise created successfully", saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getExercise(@PathVariable UUID id) {
        Exercise exercise = exerciseService.getExercise(id);
        List<Question> questions = exerciseService.getQuestionsForExercise(id);
        
        var response = new java.util.HashMap<String, Object>();
        response.put("exercise", exercise);
        response.put("questions", questions.stream().map(q -> {
            var map = new java.util.HashMap<String, Object>();
            map.put("question", q);
            if (q.getQuestionType().equals("multiple_choice")) {
                map.put("options", exerciseService.getOptionsForQuestion(q.getId()));
            }
            return map;
        }).collect(Collectors.toList()));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<ApiResponse<UserAttempt>> submitAttempt(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody AttemptSubmissionRequest request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        
        // Very basic grading simulation
        int correctCount = 0;
        List<UserAnswer> answers = new java.util.ArrayList<>();
        
        for (UserAnswerRequest ansReq : request.getAnswers()) {
            UserAnswer ans = new UserAnswer();
            Question q = questionRepository.findById(UUID.fromString(ansReq.getQuestionId())).orElseThrow();
            ans.setQuestion(q);
            
            boolean isCorrect = false;
            if (q.getQuestionType().equals("multiple_choice") && ansReq.getSelectedOptionId() != null) {
                AnswerOption opt = answerOptionRepository.findById(UUID.fromString(ansReq.getSelectedOptionId())).orElseThrow();
                ans.setSelectedOption(opt);
                isCorrect = opt.isCorrect();
            } else if (q.getQuestionType().equals("fill_blank") && ansReq.getAnswerText() != null) {
                ans.setAnswerText(ansReq.getAnswerText());
                if (ansReq.getAnswerText().trim().equalsIgnoreCase(q.getCorrectAnswerText())) {
                    isCorrect = true;
                }
            }
            
            ans.setCorrect(isCorrect);
            if (isCorrect) correctCount++;
            answers.add(ans);
        }

        BigDecimal score = BigDecimal.valueOf(correctCount * 10.0); // Arbitrary scoring

        UserAttempt attempt = attemptService.submitAttempt(user, id, answers, score, ZonedDateTime.now().minusMinutes(5)); // Simulation

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(attempt));
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<ApiResponse<List<UserAttempt>>> getUserAttempts(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<UserAttempt> attempts = attemptService.getUserAttempts(user, id);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }
}
