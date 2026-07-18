package com.elearning.listening;

import com.elearning.common.ContentLanguage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import com.elearning.common.ExerciseSkillType;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {
    Page<Exercise> findBySkillTypeAndLanguage(ExerciseSkillType skillType, ContentLanguage language, Pageable pageable);
    Page<Exercise> findBySkillType(ExerciseSkillType skillType, Pageable pageable);
    Page<Exercise> findByLanguage(ContentLanguage language, Pageable pageable);
}
