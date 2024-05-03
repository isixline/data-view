import React, { useState } from 'react';
import ReactEcharts from 'echarts-for-react';

function RelationGraph() {
    const [graph, setGraph] = useState({ nodes: [], links: [], categories: [], workspaces: [] });
    const [selectedCategories, setSelectedCategories] = useState({});

    const buildNode = (node) => {
        return {
            id: node.name,
            name: node.name,
            category: node.category,
            value: node.content
        };
    }

    const buildLinks = (node) => {
        const links = []

        for (let i = 0; i < node.links.length; i++) {
            links.push({
                source: node.links[i],
                target: node.name,
            });
        }

        for (let i = 0; i < node.references.length; i++) {
            links.push({
                source: node.name,
                target: node.references[i],
            });
        }

        return links;
    }

    const buildGraph = (data) => {
        const categories = data.categories.map(category => ({ name: category }))
        const nodes = []
        const links = []
        for (let i = 0; i < data.nodes.length; i++) {
            nodes.push(buildNode(data.nodes[i]));
            links.push(...buildLinks(data.nodes[i]));
        }

        nodes.forEach(node => {
            setNodeCategory(node, categories);
            setNodeSize(node, links);
        });

        return { nodes, links, categories, workspaces: data.workspaces};
    }

    const setNodeCategory = (node, categories) => {
        node.category = categories.findIndex(category => category.name === node.category)
    }

    const setNodeSize = (node, links) => {
        const linkCount = links.filter(link => link.source === node.id || link.target === node.id).length;
        node.symbolSize = linkCount * 2 + 5;
    }

    const fetchData = async () => {
        try {
            const dataFilePath = process.env.REACT_APP_GRAPH_DATA_FILE_PATH;
            const response = await fetch(dataFilePath);
            const jsonData = await response.json();
            setGraph(buildGraph(jsonData));
        } catch (error) {
            console.error('Error fetching data: ', error);
        }
    };

    const setTooltipFormatter = (params) => {
        return params.name + '<br> ' + (params.value ? params.value.replace(/\n/g, "<br>") : '');
    }

    const workspaceView = (workspace) => {
        const newSelectedCategories = {};
        graph.categories.forEach(category => {
            newSelectedCategories[category.name] = workspace.categories.includes(category.name);
        });
        setSelectedCategories(newSelectedCategories);
    }

    const buildOption = () => {
        return {
            legend: {
                data: graph.categories.map(function (a) {
                    return a.name;
                }),
                selected: selectedCategories,
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    data: graph.nodes,
                    links: graph.links,
                    categories: graph.categories,
                    animation: true,
                    draggable: true,
                    roam: true,
                    label: {
                        position: 'right',
                    },
                    tooltip: {
                        position: 'bottom',
                        formatter: setTooltipFormatter,
                    },
                    force: {
                        repulsion: 20,
                    },
                }
            ]
        };
    }

    return (
        <div style={{ height: '800px' }}>
            <button onClick={fetchData}>🔄</button>
            {graph.workspaces.map(workspace => (
                <button key={workspace.name} onClick={() => workspaceView(workspace)}>{workspace.name}</button>
            ))}
            <ReactEcharts
                option={buildOption()}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}

export default RelationGraph;
