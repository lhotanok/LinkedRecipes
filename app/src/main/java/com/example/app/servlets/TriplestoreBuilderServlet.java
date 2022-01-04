package com.example.app.servlets;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import static com.example.app.jena.TriplestoreInitializer.initializeDatasets;

@WebServlet(name = "triplestoreBuilderServlet", value = "/triplestoreBuilder")
public class TriplestoreBuilderServlet extends HttpServlet {
    public void init() {
        initializeDatasets();
    }
}
