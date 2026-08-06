package com.backend.market.service;

import com.backend.market.domain.Wish;
import com.backend.market.dto.WishDTO;
import com.backend.market.mapper.WishMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class WishServiceImpl implements WishService {

    private final WishMapper wishMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<WishDTO> getListByMember(String memberEmail) {

        List<Wish> result = wishMapper.selectListByMember(memberEmail);

        return result.stream()
                .map(wish -> modelMapper.map(wish, WishDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public boolean toggle(Long itemNo, String memberEmail) {

        Wish existing = wishMapper.selectOne(itemNo, memberEmail);

        if (existing != null) {
            wishMapper.delete(itemNo, memberEmail);
            return false;
        }

        Wish wish = Wish.builder()
                .itemNo(itemNo)
                .memberEmail(memberEmail)
                .build();

        wishMapper.insert(wish);
        return true;
    }

    @Override
    public long countByItem(Long itemNo) {
        return wishMapper.countByItemNo(itemNo);
    }
}
