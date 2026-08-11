import { API_URL } from "../../../../api/api";
import axiosInstance from "../../../../api/axiosInstance";

const EDIT_API = `${API_URL}/api/auth/identify/edituser/`

export const editService =async (data)=>{
try{
    const response = await axiosInstance.patch(EDIT_API , data)
    console.log(response)
    return response

}
catch (error){
    console.log(error)
    throw error
}
}