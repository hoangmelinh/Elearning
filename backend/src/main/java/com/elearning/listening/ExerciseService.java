package com.elearning.listening;

import com.elearning.common.ContentLanguage;
import com.elearning.common.ExerciseSkillType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;

    public Page<Exercise> getExercises(ExerciseSkillType skillType, ContentLanguage language, Pageable pageable) {
        if (skillType != null && language != null) {
            return exerciseRepository.findBySkillTypeAndLanguage(skillType, language, pageable);
        } else if (skillType != null) {
            return exerciseRepository.findBySkillType(skillType, pageable);
        } else if (language != null) {
            return exerciseRepository.findByLanguage(language, pageable);
        } else {
            return exerciseRepository.findAll(pageable);
        }
    }

    public Exercise getExercise(UUID id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exercise not found"));
    }

    public List<Question> getQuestionsForExercise(UUID exerciseId) {
        return questionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);
    }

    public List<AnswerOption> getOptionsForQuestion(UUID questionId) {
        return answerOptionRepository.findByQuestionId(questionId);
    }
}
