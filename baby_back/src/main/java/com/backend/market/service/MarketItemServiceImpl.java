package com.backend.market.service;

import com.backend.dto.PageRequestDTO;
import com.backend.dto.PageResponseDTO;
import com.backend.market.domain.MarketItem;
import com.backend.market.domain.MarketItemImage;
import com.backend.market.domain.RentalDetail;
import com.backend.market.dto.MarketItemDTO;
import com.backend.market.mapper.MarketItemMapper;
import com.backend.market.mapper.RentalDetailMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class MarketItemServiceImpl implements MarketItemService{

    private final MarketItemMapper marketItemMapper;

    private final RentalDetailMapper rentalDetailMapper;

    @Override
    public PageResponseDTO<MarketItemDTO> getList(PageRequestDTO pageRequestDTO) {

        int skip = (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize();

        List<MarketItem> result = marketItemMapper.selectList(skip, pageRequestDTO.getSize());

        List<MarketItemDTO> dtoList = result.stream()
                .map(this::entityToDTO)
                .collect(Collectors.toList());

        long totalCount = marketItemMapper.selectListCount();

        return PageResponseDTO.<MarketItemDTO>withAll()
                .dtoList(dtoList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    @Override
    public MarketItemDTO get(Long itemNo) {

        MarketItem item = Optional.ofNullable(marketItemMapper.selectOne(itemNo))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매물입니다.: " + itemNo));

        MarketItemDTO dto = entityToDTO(item);

        if("RENTAL".equals(item.getTradeType())) {
            RentalDetail rentalDetail = rentalDetailMapper.selectByItemNo(itemNo);
            if (rentalDetail != null) {
                dto.setDeposit(rentalDetail.getDeposit());
                dto.setMinDays(rentalDetail.getMinDays());
                dto.setMaxDays(rentalDetail.getMaxDays());
            }
        }

        return dto;
    }

    @Override
    public Long register(MarketItemDTO dto) {

        MarketItem item = dtoToEntity(dto);
        item.changeStatus("거래가능");

        marketItemMapper.insert(item);

        item.getImageList().forEach(image -> marketItemMapper.insertImage(item.getItemNo(), image));

        if ("RENTAL".equals(dto.getTradeType())) {
            RentalDetail rentalDetail = RentalDetail.builder()
                    .itemNo(item.getItemNo())
                    .deposit(dto.getDeposit() == null ? 0 : dto.getDeposit())
                    .minDays(dto.getMinDays())
                    .maxDays(dto.getMaxDays())
                    .build();
            rentalDetailMapper.insert(rentalDetail);
        }

        return item.getItemNo();
    }

    @Override
    public void modify(MarketItemDTO dto) {

        MarketItem item = Optional.ofNullable(marketItemMapper.selectOne(dto.getItemNo()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매물입니다: " + dto.getItemNo()));

        item.changeTitle(dto.getTitle());
        item.changeDescription(dto.getDescription());
        item.changePrice(dto.getPrice());
        item.changeAllowOffer(dto.isAllowOffer());

        item.clearImageList();
        List<String> uploadFileNames = dto.getUploadFileNames();
        if (uploadFileNames != null) {
            uploadFileNames.forEach(item::addImageString);
        }

        marketItemMapper.update(item);
        marketItemMapper.deleteImages(item.getItemNo());
        item.getImageList().forEach(image -> marketItemMapper.insertImage(item.getItemNo(), image));

        if ("RENTAL".equals(item.getTradeType())) {
            RentalDetail existing = rentalDetailMapper.selectByItemNo(item.getItemNo());
            int deposit = dto.getDeposit() == null ? 0 : dto.getDeposit();

            if (existing == null) {
                RentalDetail rentalDetail = RentalDetail.builder()
                        .itemNo(item.getItemNo())
                        .deposit(deposit)
                        .minDays(dto.getMinDays())
                        .maxDays(dto.getMaxDays())
                        .build();
                rentalDetailMapper.insert(rentalDetail);
            } else {
                existing.changeDeposit(deposit);
                existing.changeDays(dto.getMinDays(), dto.getMaxDays());
                rentalDetailMapper.update(existing);
            }
        }
    }

    @Override
    public void remove(Long itemNo){
        marketItemMapper.updateToDelete(itemNo, true);
    }

    @Override
    public void increaseViewCount(Long itemNo) {
        marketItemMapper.increaseViewCount(itemNo);
    }

    @Override
    public void bump(Long itemNo) {
        marketItemMapper.bump(itemNo);
    }

    private MarketItem dtoToEntity(MarketItemDTO dto) {

        MarketItem item = MarketItem.builder()
                .sellerEmail(dto.getSellerEmail())
                .title(dto.getTitle())
                .price(dto.getPrice())
                .description(dto.getDescription())
                .tradeType(dto.getTradeType())
                .category(dto.getCategory())
                .ageRange(dto.getAgeRange())
                .condition(dto.getCondition())
                .allowOffer(dto.isAllowOffer())
                .locationName(dto.getLocationName())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();

        List<String> uploadFileNames = dto.getUploadFileNames();
        if (uploadFileNames != null) {
            uploadFileNames.forEach(item::addImageString);
        }

        return item;
    }

    private MarketItemDTO entityToDTO(MarketItem item) {

        MarketItemDTO dto = MarketItemDTO.builder()
                .itemNo(item.getItemNo())
                .sellerEmail(item.getSellerEmail())
                .title(item.getTitle())
                .price(item.getPrice())
                .description(item.getDescription())
                .tradeType(item.getTradeType())
                .category(item.getCategory())
                .ageRange(item.getAgeRange())
                .condition(item.getCondition())
                .allowOffer(item.isAllowOffer())
                .status(item.getStatus())
                .locationName(item.getLocationName())
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .viewCount(item.getViewCount())
                .recallChecked(item.isRecallChecked())
                .recallFlag(item.isRecallFlag())
                .bumpAt(item.getBumpAt())
                .regTime(item.getRegTime())
                .modTime(item.getModTime())
                .build();

        List<MarketItemImage> imageList = item.getImageList();
        if (imageList != null && !imageList.isEmpty()) {

            dto.setUploadFileNames(imageList.stream().map(MarketItemImage::getFileName).collect(Collectors.toList()));
        }

        return dto;
    }
}
