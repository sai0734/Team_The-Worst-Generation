package com.backend.printorder.client;

import com.backend.printorder.dto.TossPaymentResponseDTO;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Component
@Log4j2
public class TossPaymentClient {

    @Value("${toss.secret-key}")
    private String secretKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5)).build();

    private final Gson gson = new Gson();

    public TossPaymentResponseDTO confirm(String paymentKey, String orderId, Integer amount) {

        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("paymentKey", paymentKey);
        requestBody.addProperty("orderId", orderId);
        requestBody.addProperty("amount", amount);

        String encodedAuth = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.tosspayments.com/v1/payments/confirm"))
                .header("Authorization", "Basic " + encodedAuth)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if(response.statusCode() != 200) {
                JsonObject errorBody = JsonParser.parseString(response.body()).getAsJsonObject();

                String code = errorBody.has("code") ? errorBody.get("code").getAsString() : "UNKNOWN";

                String message = errorBody.has("message") ? errorBody.get("message").getAsString() : "결제 승인에 실패했습니다.";
                log.error("Toss 결제승인 실패 (" + code + "): " + message);
                throw new IllegalArgumentException("결제 승인에 실패했습니다: " + message);
            }

            return gson.fromJson(response.body(), TossPaymentResponseDTO.class);

        } catch (IOException | InterruptedException e) {
            log.error("Toss API 호출 실패:" + e.getMessage());
            throw  new IllegalArgumentException("결제 서버에 연결할 수 없습니다.", e);
        }

    }

}
