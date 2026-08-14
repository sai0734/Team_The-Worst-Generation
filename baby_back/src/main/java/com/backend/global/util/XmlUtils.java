package com.backend.global.util;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

public final class XmlUtils {

    private XmlUtils() {
    }

    public static Document parse(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setExpandEntityReferences(false);

            return factory.newDocumentBuilder()
                    .parse(new InputSource(new StringReader(xml)));

        } catch (Exception e) {
            throw new IllegalStateException("XML parse failed.", e);
        }
    }

    public static List<Element> elements(Document document, String tagName) {
        NodeList nodes = document.getElementsByTagName(tagName);
        List<Element> result = new ArrayList<>();

        for (int i = 0; i < nodes.getLength(); i++) {
            result.add((Element) nodes.item(i));
        }

        return result;
    }

    public static String text(Element element, String tagName) {
        NodeList nodes = element.getElementsByTagName(tagName);

        if (nodes.getLength() == 0 || nodes.item(0) == null) {
            return null;
        }

        return ValueParseUtils.blankToNull(nodes.item(0).getTextContent());
    }

    public static String firstText(Document document, String tagName) {
        NodeList nodes = document.getElementsByTagName(tagName);

        if (nodes.getLength() == 0 || nodes.item(0) == null) {
            return null;
        }

        return ValueParseUtils.blankToNull(nodes.item(0).getTextContent());
    }
}
