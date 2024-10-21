//Application enums

export enum ApiMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export enum AuthEndPoints {
    register = "/users"
}

export enum SocketEvents {
    //  create a room
    CREATE_ROOM = "createRoom",
    // join in the room
    JOIN_ROOM = "joinRoom",
    // new Peer
    NEW_PEER = "newPeer",
    //  get All Peers
    GET_PEERS = "getAllPeers",
    //get RouterRtpCapabilities of the room
    GET_ROUTER_RTPCAPABILITIES = "getRouterRtpCapabilities",
    //create createWebRtcTransport transport
    CREATE_WEBRTC_TRANSPORT = "createWebRtcTransport",
    //connect transport
    CONNECT_TRANSPORT = "connectTransport",
    //produce
    PRODUCE = "produce",
    //consume
    CONSUME = "consume",
    //close the producer of the room
    PRODUCER_CLOSED = "producerClosed",
    //pause the producer of the room
    PAUSE_PRODUCER = "pauseProducer",
    //resume the producer of the room
    RESUME_PRODUCER = "resumeProducer",
    //resume the consumer of the room
    RESUME_CONSUMER = "resumeConsumer",
    //get producers of the room
    GET_PRODUCERS = "getProducers",
    //remove the peer of the room for server side event
    EXIT_ROOM = "exitRoom",
    //remove the peer of the room for client side event
    PEER_CLOSED = "peerClosed", 
    //new producers for room
    NEW_PRODUCERS = "newProducers",
}