package com.backend.printorder.mapper;

import com.backend.printorder.domain.PrintOrder;
import com.backend.printorder.domain.PrintOrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PrintOrderMapper {

    void insertOrder(PrintOrder printOrder);

    void insertOrderItem(PrintOrderItem printOrderItem);

    PrintOrder selectByOrderId(@Param("orderId") String orderId);

    List<PrintOrderItem> selectItemsByOrderNo(@Param("orderNo") Long orderNo);

    List<PrintOrder> selectListByEmail(@Param("email") String email);

    void updateStatus(@Param("orderId") String orderId, @Param("status") String status,
                      @Param("paymentKey") String paymentKey);

}
