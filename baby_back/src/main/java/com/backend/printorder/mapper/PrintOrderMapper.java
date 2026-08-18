package com.backend.printorder.mapper;

import com.backend.printorder.domain.PrintOrder;
import com.backend.printorder.domain.PrintOrderItem;
import com.backend.printorder.dto.PrintOrderItemDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PrintOrderMapper {

    void insertOrder(PrintOrder printOrder);

    void insertOrderItem(PrintOrderItem printOrderItem);

    PrintOrder selectByOrderId(@Param("orderId") String orderId);

    List<PrintOrderItemDTO> selectItemsByOrderNo(@Param("orderNo") Long orderNo);

    List<PrintOrder> selectListByEmail(@Param("email") String email, @Param("skip") int skip, @Param("size") int size);

    long selectListCountByEmail(@Param("email") String email);

    void updateStatus(@Param("orderId") String orderId, @Param("status") String status,
                      @Param("paymentKey") String paymentKey);

    void deleteItemsByBabyNo(@Param("babyNo") Long babyNo);

    void deleteByBabyNo(@Param("babyNo") Long babyNo);

    void deleteItemsByAlbumNo(@Param("albumNo") Long albumNo);

    long countPaidItemsByAlbumNo(@Param("albumNo") Long albumNo);

}
