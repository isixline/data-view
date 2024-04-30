import React, { useState, useEffect } from 'react';
import ReactEcharts from 'echarts-for-react';

function RelationGraph() {
    const [graph, setGraph] = useState({ nodes: [], links: [], categories: [] });

    useEffect(() => {
        fetchData();
    }, []);

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
            const categories = jsonData.categories.map(category => ({ name: category }))
            const nodes = []
            const links = []
            for (let i = 0; i < jsonData.nodes.length; i++) {
                nodes.push(buildNode(jsonData.nodes[i]));
                links.push(...buildLinks(jsonData.nodes[i]));
            }

            nodes.forEach(node => {
                setNodeCategory(node, categories);
                setNodeSize(node, links);
            });

            setGraph({ nodes, links, categories });
        } catch (error) {
            console.error('Error fetching data: ', error);
        }
    };

    const setTooltipFormatter = (params) => {
        return params.name + '<br> ' + (params.value ? params.value.replace(/\n/g, "<br>") : '');
    }

    const getOption = () => {
        console.log(graph);
        return {
            legend: {
                data: graph.categories.map(function (a) {
                    return a.name;
                })
            },
            tooltip: {},
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
    };

    return (
        <div style={{ height: '800px' }}>
            <ReactEcharts
                option={getOption()}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}

export default RelationGraph;
