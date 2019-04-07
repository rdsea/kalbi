

interface DrivingData {
    id: string,
    velocity: number,
    acceleration: number
}

interface IDrivingDataProducer {

    initialize();
    run(roundsNr: number);

}

interface IDrivingDataConsumer {

    run();

}

interface TransactionAnalysisWrapper {
    txId: string,
    blockNum: number,
    creationTime: number,
    acceptationTime: number,
    payloadData: DrivingData
}

interface IDrivingDataDAO {

    insert(vehicle: DrivingData): Promise<TransactionAnalysisWrapper>;

    updateVelocity(vehicle: DrivingData): Promise<TransactionAnalysisWrapper>;

    updateVelocity(vehicle: DrivingData): Promise<TransactionAnalysisWrapper>;

    update(vehicle: DrivingData): Promise<TransactionAnalysisWrapper>;

    get(id: string): Promise<DrivingData>;

}

interface TransactionResult {
    data: TransactionAnalysisWrapper,
    error: string
}

interface QualityMetric {
    name: string,
    description: string
}

interface DataExchangeAnalysis extends QualityMetric {
    nodeRef: NodeRef,
    txResults: TransactionResult[],
    acceptedTxCount: number,
    failedTxCount: number
}

interface NodeRef {
    name: string
}