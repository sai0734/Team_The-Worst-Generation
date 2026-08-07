package com.backend.allergy.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RecipeRecommend {
    private  long recommendNo; // pk
    private long checkNo; // fk
    private String productType;
    private String recommendRecipe;
    private String mixingInstruction;
    private LocalDateTime regTime;

}
