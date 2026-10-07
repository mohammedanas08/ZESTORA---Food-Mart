package com.zestora.payment;

import com.zestora.TestSecrets;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

class RazorpaySignatureTest {
    private static final String SECRET = TestSecrets.random(24);

    private static String hmac(String secret, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes()));
    }

    @Test
    void acceptsCorrectSignatureAndRejectsEverythingElse() throws Exception {
        String sig = hmac(SECRET, "order_1|pay_1");
        assertThat(RazorpayGateway.hmacMatches(SECRET, "order_1|pay_1", sig)).isTrue();
        assertThat(RazorpayGateway.hmacMatches(SECRET, "order_1|pay_2", sig)).isFalse();     // different payment
        assertThat(RazorpayGateway.hmacMatches(TestSecrets.random(24), "order_1|pay_1", sig)).isFalse();      // different secret
        assertThat(RazorpayGateway.hmacMatches(SECRET, "order_1|pay_1", null)).isFalse();
        assertThat(RazorpayGateway.hmacMatches(SECRET, "order_1|pay_1", "")).isFalse();
    }

    @Test
    void mockGatewayNeverVerifiesAnything() {
        var mock = new MockGateway();
        assertThat(mock.verifyPaymentSignature("o", "p", "anything")).isFalse();
        assertThat(mock.verifyWebhookSignature("{}", "anything")).isFalse();
    }
}
