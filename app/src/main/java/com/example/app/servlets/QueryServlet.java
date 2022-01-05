package com.example.app.servlets;

import com.example.app.repository.RepositoryHandler;
import j2html.tags.ContainerTag;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static j2html.TagCreator.*;
import static j2html.TagCreator.each;

public abstract class QueryServlet extends HttpServlet {
    public void init() { }

    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        var writer = response.getWriter();

        var repositoryHandler = new RepositoryHandler();
        repositoryHandler.initializeRepository();

        try {
            repositoryHandler.initializeConnection();

            TupleQuery tupleQuery = repositoryHandler.prepareConnectionTupleQuery(createSelectQuery());
            TupleQueryResult result = tupleQuery.evaluate();

            List<ContainerTag> divContainers = new ArrayList<>();

            for (var bindingSet : result) {
                var divContainer = buildContainer(bindingSet);
                divContainers.add(divContainer);
            }

            var pageTitle = h1(getPageTitle()).withData("property", "dc:title");

            var html = body( pageTitle,
                    each(divContainers, container -> container)
            ) .withData("prefix", "dc: http://purl.org/dc/terms/")
                    .withData("prefix",
                            "dc: http://purl.org/dc/terms/" +
                                  " schema: http://schema.org/")
                    .render();

            writer.println(html);

        } catch (Exception ex) {
            writer.println(ex);
        } finally {
            repositoryHandler.closeConnection();
        }
    }

    public void destroy() { }

    protected abstract ContainerTag buildContainer(BindingSet bindingSet);

    protected abstract String createSelectQuery();

    protected abstract String getPageTitle();
}
