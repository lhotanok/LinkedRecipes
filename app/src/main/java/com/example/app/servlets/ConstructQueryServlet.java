package com.example.app.servlets;

import com.example.app.repository.RepositoryHandler;
import j2html.tags.ContainerTag;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.QueryResults;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;

import static j2html.TagCreator.*;

public abstract class ConstructQueryServlet extends QueryServlet {
    @Override
    protected void processRepositoryConnection(RepositoryHandler repositoryHandler, PrintWriter writer) {
        var graphQuery = repositoryHandler.prepareConnectionGraphQuery(createConstructQuery());
        var graphQueryResult = graphQuery.evaluate();

        List<ContainerTag> divContainers = new ArrayList<>();

        for (var statement : graphQueryResult) {
            var divContainer = buildContainer(statement);
            divContainers.add(divContainer);
        }

        Model resultModel = QueryResults.asModel(graphQueryResult);


        renderHtml(divContainers, writer);
    }

    protected abstract String createConstructQuery();

    protected abstract ContainerTag buildContainer(Statement statement);
}
