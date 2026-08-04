package com.backend.ledger.mapper;

import java.time.LocalDate;
import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.backend.ledger.domain.Ledger;

public interface LedgerMapper {

    List<Ledger> selectListByEmailAndRange(
        @Param("email") String email,
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );

    Ledger selectByLno(@Param("lno") Long lno);

    void insert(Ledger ledger);

    void update(Ledger ledger);

    void delete(@Param("lno") Long lno);
}
