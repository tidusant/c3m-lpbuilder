import { encDat2, decDat } from "./crypto";
import Cookies from 'js-cookie'
import Router from 'next/router'
import { useSelector, useDispatch } from 'react-redux'

export async function GetData(requestUrl, params, userstate) {
    
    //cannot use dispatch in this function
    let rs = { Status: 0, Error: "", Message: "", Data: {} }
    let sex = Cookies.get("_s")

    if ((sex === undefined || sex === "") && requestUrl !== "CreateSex") {
        rs.Status = 0;
        //rs.Error = "No session, please reload page."
        if (Router.pathname != "/login") {
            Cookies.set("redirect_login", Router.pathname)
            SafeRedirect("/login")
        }
    } else {
        Log("call: " + requestUrl + " data:" + params + " - " + sex)

        try {
            const res = await fetch(process.env.NEXT_PUBLIC_API_URL + encDat2(requestUrl, 7), {
                method: 'POST',
                body: "data=" + encDat2(sex + "|" + params, 9),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            const datatext = await res.text();

            //get data and decode
            let data = ""
            try {
                
                    data = decDat(datatext);
            }
            catch (ex) {
                console.log(ex.message)

            }
            //parse to json object

            let rtdata = {};
            try {
                rtdata = JSON.parse(data)
                if (rtdata.Status !== undefined) rs.Status = rtdata.Status;
                if (rtdata.Error !== undefined) rs.Error = rtdata.Error;
                if (rtdata.Message !== undefined) rs.Message = rtdata.Message;
                if (rtdata.Data !== undefined) rs.Data = rtdata.Data;
            } catch (ex) {
                rs.Error = ex.message;
            }


            //update session if request success

            if (rtdata.Status === 1) {
                if (userstate.token) Cookies.set("_s", encDat2(userstate.token), { expires: 1 / (24 * 2) });
            } else if (rtdata.Status === -1) {

                if (Router.pathname != "/login") {
                    Cookies.set("redirect_login", Router.pathname)
                    SafeRedirect("/login")
                }

            }

        } catch (error) {
            rs.Error = error.message;
        }
    }
    return Promise.resolve(rs);

}

export async function GetDataLocal(requestUrl, params) {
    //cannot use dispatch in this function
    let rs = { Status: 0, Error: "", Message: "", Data: {} }

    Log("call local: " + requestUrl + " data:" + params)

    try {
        const res = await fetch(requestUrl, {
            method: 'POST',
            body: "data=" + params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        const datatext = await res.text();


        let rtdata = {};
        try {
            rtdata = JSON.parse(datatext)
            if (rtdata.Status !== undefined) rs.Status = rtdata.Status;
            if (rtdata.Error !== undefined) rs.Error = rtdata.Error;
            if (rtdata.Message !== undefined) rs.Message = rtdata.Message;
            if (rtdata.Data !== undefined) rs.Data = rtdata.Data;
        } catch (ex) {
            rs.Error = ex.message;
        }

        if (rtdata.Status === -1) {

            if (Router.pathname != "/login") {
                Cookies.set("redirect_login", Router.pathname)
                SafeRedirect("/login")
            }

        }

    } catch (error) {
        rs.Error = error.message;
    }

    return Promise.resolve(rs);

}

export function Log(message) {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        console.log(message)
    }
}
export async function checkAuth(login_redirect, userstate) {
    //becarefull to use dispatch here, it's maybe become an fewer hook error
    const dispatch = useDispatch()
    let rs = { Status: 0, Error: "not auth", Message: "", Data: {} }
    const sex = Cookies.get('_s');
    var isLogin = false

    if (!userstate.username) {

        if (sex) {
            //call request to check auth for this session
            const res = await GetData("aut", "t", userstate)

            // .then(data=>{      
            console.log("data return:", res)
            if (res.Status === 1) {
                rs = res
                try {
                    rs.data = JSON.parse(rs.Data)
                    if (rs.data.username != "") {
                        isLogin = true
                        dispatch({
                            type: 'USER',
                            data: rs.data
                        })
                    }
                } catch (e) {
                    rs.Status = 0;
                    rs.Data = {};
                    rs.Error = e.message
                }
            }
        }
        //     });
        //}
    } else {
        rs.status = 1
        isLogin = true
    }
    if (!isLogin) {
        // dispatch({
        //     type: 'LOGIN_REDIRECT',
        //     data: login_redirect
        //   })

        Cookies.set("redirect_login", login_redirect)
        SafeRedirect("/login")

    }
    return Promise.resolve(rs);

}

export function SafeRedirect(redirect) {
    if (typeof window !== 'undefined') {
        Router.push(redirect)
    } else {
        //wait 100ms to page fully render
        setTimeout(() => { SafeRedirect(redirect) }, 100)
    }
}