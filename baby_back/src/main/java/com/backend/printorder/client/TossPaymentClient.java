package com.backend.printorder.client;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
@Log4j2
public class TossPaymentClient {

    @Value("${toss.secret-key}")
    private String secretKey;

    private final Gson gson = new Gson();

    public JsonObject confirm(String paymentKey, String orderId, Long amount) throws IOException {

        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("paymentKey", paymentKey);
        requestBody.addProperty("orderId", orderId);
        requestBody.addProperty("amount", amount);

        Base64.Encoder encoder = Base64.getEncoder();
        byte[] encodedBytes = encoder.encode((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        String authorizations = "Basic " + new String(encodedBytes, StandardCharsets.UTF_8);

        URL url = new URL("https://api.tosspayments.com/v1/payments/confirm");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
    }

}
