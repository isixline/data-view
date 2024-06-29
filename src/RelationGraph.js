import React, { useState } from 'react';
import ReactEcharts from 'echarts-for-react';
import './RelationGraph.css';

function RelationGraph() {
    const [graph, setGraph] = useState({ nodes: [], links: [], categories: [], workspaces: [] });
    const [selectedCategories, setSelectedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const buildNode = (node) => {
        return {
            id: node.name,
            name: node.name,
            category: node.category,
            value: node.content,
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

        return { nodes, links, categories, workspaces: data.workspaces };
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
    }


    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const showNode = (node) => {
        node.itemStyle = { opacity: 1 };
    }

    const hideNode = (node) => {
        node.itemStyle = { opacity: 0.1 };
    }

    const handleLinksFlowNodeStyle = (nodes, links) => {
        const nodeItemStyleMap = nodes.reduce((acc, node) => {
            acc[node.id] = node.itemStyle;
            return acc;
        }, {});

        for (const link of links) {
            const sourceStyle = nodeItemStyleMap[link.source]
            const targetStyle = nodeItemStyleMap[link.target]

            if (sourceStyle && targetStyle && sourceStyle["opacity"] && targetStyle["opacity"]) {
                link.lineStyle = { opacity: Math.min(sourceStyle["opacity"], targetStyle["opacity"]) };
            }
        }
    }

    const handleFormSubmit = (event) => {
        event.preventDefault();
        if (searchTerm === '') {
            for (const node of graph.nodes) {
                showNode(node);
            }
            handleLinksFlowNodeStyle(graph.nodes, graph.links);
            setGraph({ ...graph });
            return;
        }

        const searchContent = searchTerm.toLocaleLowerCase();
        const matchWith = []
        if (searchContent.startsWith('name:')) {
            matchWith.push({ "name": searchContent.substring(5) });
        } else if (searchContent.startsWith('value:')) {
            matchWith.push({ "value": searchContent.substring(8) });
        } else {
            matchWith.push({ "name": searchContent });
            matchWith.push({ "value": searchContent });
        }

        for (const node of graph.nodes) {
            hideNode(node);
            for (let i = 0; i < matchWith.length; i++) {
                const key = Object.keys(matchWith[i])[0];
                const regex = new RegExp(matchWith[i][key].trim());
                if (node[key] && regex.test(node[key].toLocaleLowerCase())) {
                    showNode(node);
                    break;
                }
            }
        }

        handleLinksFlowNodeStyle(graph.nodes, graph.links);
        setGraph({ ...graph });
    };

    const handleNodeClick = (e) => {
        if (e.componentType === 'series') {
            const nodeText = e.name;
            navigator.clipboard.writeText(nodeText).then(() => {
                console.log('选中节点：' + nodeText);
            }).catch((err) => {
                alert('节点文本无法复制' + err);
            });
        }
    };

    return (
        <div style={{ height: '800px' }}>
            <div className='operating-area'>
                <button onClick={fetchData}>🔄</button>
                <div className='workspace-area'>
                    {graph.workspaces.map(workspace => (
                        <button key={workspace.name} onClick={() => workspaceView(workspace)}>{workspace.name}</button>
                    ))}
                </div>
                <div>
                    <form onSubmit={handleFormSubmit}>
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={handleInputChange}
                        />
                    </form>
                </div>
            </div>
            <ReactEcharts
                option={buildOption()}
                onEvents={{
                    dblclick: handleNodeClick
                  }}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}

export default RelationGraph;
