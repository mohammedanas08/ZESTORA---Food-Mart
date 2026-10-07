package com.zestora.seed;

import com.zestora.config.AppProperties;

/** The single password used for all seeded demo accounts. It must come from the environment, never from source code. */
final class DemoPasswords {
    private DemoPasswords() {}

    static String require(AppProperties props) {
        String pw = props.dev().demoPassword();
        if (pw == null || pw.length() < 8) {
            throw new IllegalStateException("Demo data is enabled but DEMO_PASSWORD is missing or shorter than 8 characters. "
                    + "Copy backend/.env.example to backend/.env and set DEMO_PASSWORD.");
        }
        return pw;
    }
}
