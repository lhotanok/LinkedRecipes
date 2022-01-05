package com.example.app.servlets;

import com.example.app.repository.RepositoryHandler;
import j2html.tags.ContainerTag;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import static j2html.TagCreator.*;

public abstract class QueryServlet extends HttpServlet {
    public void init() { }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        var writer = response.getWriter();

        var repositoryHandler = new RepositoryHandler();
        repositoryHandler.initializeRepository();

        try {
            repositoryHandler.initializeConnection();
            processRepositoryConnection(repositoryHandler, writer);

        } catch (Exception ex) {
            writer.println(ex);
        } finally {
            repositoryHandler.closeConnection();
        }
    }

    public void destroy() { }

    protected abstract void processRepositoryConnection(RepositoryHandler repositoryHandler, PrintWriter writer);

    protected abstract String getPageTitle();

    protected void renderHtml(List<ContainerTag> divContainers, PrintWriter writer) {
        var pageTitle = h1(getPageTitle()).withData("property", "dc:title");

        var html = body( pageTitle,
                each(divContainers, container -> container)
        ) .withData("prefix", "dc: http://purl.org/dc/terms/")
                .withData("prefix",
                        "dc: http://purl.org/dc/terms/" +
                                " schema: http://schema.org/")
                .render();

        writer.println(html);
    }
}
