package com.Tasksphere.util;

import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class Sanitizer {

    private static final Logger log = LoggerFactory.getLogger(Sanitizer.class);

    private Sanitizer() {}

    public static String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        // 1. Decode entities before sanitizing so encoded tags cannot bypass cleaning
        String decodedInput = Parser.unescapeEntities(input, false);

        // 2. Strip all HTML/script tags completely
        String sanitized = Jsoup.clean(decodedInput, Safelist.none()).trim();

        // 3. Security Audit Logging: Warn if the input contained tags or was modified
        if (!sanitized.equals(input.trim())) {
            log.warn("Potential XSS payload detected and sanitized. Raw input: [{}], Sanitized result: [{}]",
                    input, sanitized);
        }

        return sanitized;
    }
}
