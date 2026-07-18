package com.elearning.listening;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerOptionRepository extends JpaRepository<AnswerOption, UUID> {
    List<AnswerOption> findByQuestionId(UUID questionId);
}
