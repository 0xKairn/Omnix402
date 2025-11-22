import { Types } from "mongoose";
import { Call, CallModel } from "../models/call.model";

export class CallRepository {
    async createNewCall(callData: Partial<Call>): Promise<Call> {
        const call = new CallModel(callData);
        return await call.save();
    }

    async updateCallStatus(callId: string, updateData: Partial<Call>): Promise<Call | null> {
        return await CallModel.findByIdAndUpdate(callId, updateData, { new: true });
    }

    async updateCall(callId: Types.ObjectId, updateData: Partial<Call>): Promise<Call | null> {
        return await CallModel.findByIdAndUpdate(callId, updateData, { new: true });
    }

    async getCallById(callId: string): Promise<Call | null> {
        return await CallModel.findById(callId);
    }
}