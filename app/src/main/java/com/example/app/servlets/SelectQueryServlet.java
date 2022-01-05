package com.example.app.servlets;

import com.example.app.repository.RepositoryHandler;
import j2html.tags.ContainerTag;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;

public abstract class SelectQueryServlet extends QueryServlet {
    @Override
    protected void processRepositoryConnection(RepositoryHandler repositoryHandler, PrintWriter writer) {
        TupleQuery tupleQuery = repositoryHandler.prepareConnectionTupleQuery(createSelectQuery());
        TupleQueryResult result = tupleQuery.evaluate();

        List<ContainerTag> divContainers = new ArrayList<>();

        for (var bindingSet : result) {
            var divContainer = buildContainer(bindingSet);
            divContainers.add(divContainer);
        }

        renderHtml(divContainers, writer);
    }

    protected abstract String createSelectQuery();

    protected abstract ContainerTag buildContainer(BindingSet bindingSet);

}
