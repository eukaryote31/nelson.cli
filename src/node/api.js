const http = require('http');
const HttpDispatcher = require('httpdispatcher');

function createAPI (node) {
    const dispatcher = new HttpDispatcher();
    dispatcher.onGet('/', function(req, res) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(getNodeStats(node), null, 4));
    });

    dispatcher.onGet('/peers', function(req, res) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(node.list.all(), null, 4));
    });

    dispatcher.onGet('/peer-stats', function(req, res) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(getSummary(node), null, 4));
    });

    const server = http.createServer((request, response) => {
        try {
            dispatcher.dispatch(request, response);
        } catch(err) {
            console.log(err);
        }
    });
    server.listen(node.opts.apiPort, node.opts.apiHostname);
}

function getNodeStats (node) {
    const {
        cycleInterval,
        epochInterval,
        beatInterval,
        dataPath,
        port,
        apiPort,
        IRIPort,
        TCPPort,
        UDPPort,
        isMaster,
        temporary
    } = node.opts;
    const {
        lastCycle,
        lastEpoch,
        personality,
        currentCycle,
        currentEpoch,
        startDate
    } = node.heart;
    const totalPeers = node.list.all().length;
    const isIRIHealthy = node.iri && node.iri.isHealthy;
    const connectedPeers = Array.from(node.sockets.keys())
        .filter((p) => node.sockets.get(p).readyState === 1)
        .map((p) => p.data);

    return {
        ready: node._ready,
        isIRIHealthy,
        totalPeers,
        connectedPeers,
        config: {
            cycleInterval,
            epochInterval,
            beatInterval,
            dataPath,
            port,
            apiPort,
            IRIPort,
            TCPPort,
            UDPPort,
            isMaster,
            temporary
        },
        heart: {
            lastCycle,
            lastEpoch,
            personality,
            currentCycle,
            currentEpoch,
            startDate
        }
    }
}

function getSummary (node) {
    const now = new Date();
    const hour = 3600000;
    const hourAgo = new Date(now - hour);
    const fourAgo = new Date(now - (hour * 4));
    const twelveAgo = new Date(now - (hour * 12));
    const dayAgo = new Date(now - (hour * 24));
    const weekAgo = new Date(now - (hour * 24 * 7));
    return {
        newNodes: {
            hourAgo: node.list.all().filter(p => p.data.dateCreated >= hourAgo).length,
            fourAgo: node.list.all().filter(p => p.data.dateCreated >= fourAgo).length,
            twelveAgo: node.list.all().filter(p => p.data.dateCreated >= twelveAgo).length,
            dayAgo: node.list.all().filter(p => p.data.dateCreated >= dayAgo).length,
            weekAgo: node.list.all().filter(p => p.data.dateCreated >= weekAgo).length,
        },
        activeNodes: {
            hourAgo: node.list.all().filter(p => p.data.dateLastConnected >= hourAgo).length,
            fourAgo: node.list.all().filter(p => p.data.dateLastConnected >= fourAgo).length,
            twelveAgo: node.list.all().filter(p => p.data.dateLastConnected >= twelveAgo).length,
            dayAgo: node.list.all().filter(p => p.data.dateLastConnected >= dayAgo).length,
            weekAgo: node.list.all().filter(p => p.data.dateLastConnected >= weekAgo).length,
        }
    }
}

module.exports = {
    createAPI,
    getNodeStats
};
