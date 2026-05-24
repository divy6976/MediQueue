import {Request , Response} from 'express'
import {callNext, completeToken} from "../services/queue.service"
 

export const callNextPatient= async (req:Request,res:Response)=>{
const {department}=req.body

const token=await callNext(department)
if(!token){
    return res.status(404).json({message:"No patients in queue"})   
}

res.json({message:"Next patient called", token})



}


export const completeOrSkip= async (req:Request,res:Response)=>{
    try {
   const { tokenId, action } = req.body;
   const normalizedTokenId = Number(tokenId);

   if (!Number.isInteger(normalizedTokenId) || normalizedTokenId <= 0) {
     return res.status(400).json({ message: "Valid tokenId is required" });
   }

   if (action !== "DONE" && action !== "SKIPPED") {
     return res.status(400).json({ message: "action must be DONE or SKIPPED" });
   }

   const result = await completeToken(normalizedTokenId, action);

   if (!result) {
     return res.status(404).json({ message: "Token not found" });
   }

   res.json({
     success: true,
     result,
   });
 } catch (error) {
   const message =
     error instanceof Error ? error.message : "Unknown internal server error";
   res.status(500).json({ message: "Failed to complete token", error: message });
 }


}

