
import Head from 'next/head'

import Loading from '../components/loading'
import Layouttemplate from '../components/layouttemplate'
import { Router, useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect,componentDidMount } from 'react'
import { checkAuth } from '../components/data'
import Cookies from 'js-cookie'
import axios from 'axios';

import { GetData, GetDataLocal } from "../components/data";

import { toast } from "react-toastify";
export default function Home() {
  
  const userstate = useSelector((state) => state)
  const router = useRouter()
  
  const [state, setState] = useState({
    isFirstCall: true,
    isLoading: false,
    isRender:false,
    myRef:React.createRef(),
    nextAction: "get",
    params: Object.keys(router.query).length > 0 ? router.query : { "tpl": Cookies.get("tpl") },
    payload: {}
  })

  useEffect(() => {
    //after render
    
    

  }, []);
// componentDidUpdate
useEffect(()=>{
  
  if(state.myRef.current){
    var dragula = require('react-dragula');    
    const drake=dragula([state.myRef.current,document.querySelectorAll("div.drop-zone"),document.querySelector("div.mega-menu")],{
      copy: function (el, target) {
        return !target.classList.contains("drop-zone")

      },
      moves: function (el, source, handle, sibling) {
        if(el.classList.contains("cus-not-draggable"))return false
        return true; // elements are always draggable by default
      },
    
      copySortSource: false,
      accepts: function (el, target, source, sibling) {

        return target.classList.contains("drop-zone")
        //return true; // elements can be dropped in any of the `containers` by default
      },
    });

    drake.on('shadow', (el, target, source) => {
      if(!target||!target.classList.contains("drop-zone"))return
      el.classList.remove("float-left")
      el.className+=" mb-4"
      const content=state.MTools[el.getAttribute("data-id")]
      
        el.innerHTML=content
      
      
    })

    drake.on('drop', (el, target, source,sibling) => {
      console.log(el,target,source,sibling)
      
      
      
      console.log()
    })


  }
}) 

  //====== all the run once logic code should go here
  if (state.isFirstCall) {
    setState({ ...state, isFirstCall: false, isLoading: true })
    //alway check auth before render, if aut is true=> page will rerender
    checkAuth("/", JSON.parse(JSON.stringify(userstate)))
    return <></>
  }
  else {
    //=========== event handler:

    //=========================


    console.log(state)
    if (userstate.username) {
      console.log(userstate)

      //=============================

      //=============other normal function here
      //check the page action, this will loop until page action is empty or error return    
      //and this is run only when isLoading=true
      //remember to set next action=empty or isloading=false to stop loop


      if (state.isLoading) {
        switch (state.nextAction) {
          case "get":
            if (state.params.tpl) {
              GetDataLocal("gettemplate", state.params.tpl).then(rs => {
                console.log("data return", rs)
                if (rs.Status === 1) {
                  try {
                    const data = JSON.parse(rs.Data)
                    console.log(data)
                    let MTools={}
                    if(data.Tools&&data.Tools.length>0){
                      for(let i=0,n=data.Tools.length;i<n;i++){
                        const tool=data.Tools[i]
                        if(tool.Child&&tool.Child.length>0){
                          for(let j=0,m=tool.Child.length;j<m;j++){
                            const toolc=tool.Child[j]
                            MTools[`landingpage-tool-`+tool.Name+`-`+toolc.Name]=toolc.Content
                          }
                        }else{
                          MTools[`landingpage-tool-`+tool.Name]=tool.Content
                        }
                      }
                    }
                    data.MTools=MTools
                    setState({ ...state, isLoading: false, nextAction: "", ...data })
                    return
                  } catch (e) {
                    toast.error(e.message)
                  }
                } else {
                  toast.error(rs.Error)
                }
                setState({ ...state, isLoading: false, nextAction: "" })
              })
            }
            break;
          case "delete":
            GetDataLocal("delete", state.payload.name).then(rs => {
              console.log("data return", rs)
              if (rs.Status === 1) {
                try {
                  const data = JSON.parse(rs.Data)
                  setState({ ...state, isLoading: false, nextAction: "", Templates: data })
                  return
                } catch (e) {
                  toast.error(e.message)
                }
              } else {
                toast.error(rs.Error)
              }
              setState({ ...state, isLoading: false, nextAction: "" })
            })
            break;
          case "create":
            // Create an object of formData 
            const formData = new FormData();

            // Update the formData object 
            if (state.file == "") {
              toast.error("File empty")
              setState({ ...state, isLoading: false, nextAction: "" })
              break;
            }
            formData.append("file", state.file, state.file.name)
            formData.append("templatename", state.templatename)
            // Details of the uploaded file 

            axios.post("/create", formData, {
              headers: {
                "Content-Type": "multipart/form-data"
              }
            }).then(res => {
              // then print response status
              let rs = res.data
              console.log(res)
              if (rs.Status === 1) {
                try {
                  const data = JSON.parse(rs.Data)
                  setState({ ...state, modal: false, file: "", templatename: "", isLoading: false, nextAction: "", Templates: data })
                  return
                } catch (e) {
                  toast.error(e.message)
                }
              } else {
                toast.error(rs.Error)
              }
              setState({ ...state, isLoading: false, nextAction: "" })
            });
            break;

          default: setState({ ...state, nextAction: "", isLoading: false });
        }
      }
    }
    //=============

    return (
      <Layouttemplate>

        <Head>
          <title>C3M - Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {state.isLoading && <Loading />}
        {!state.isLoading &&

          <div class="grid grid-flow-col grid-cols-12">
            <div class="py-2 text-gray-900 bg-white rounded-lg shadow-lg">
              <div class="fixed w-1/12 z-30 text-center">
                <button onClick={() => { router.push("/") }} type="button" class="btn btn-primary btn-xs m-auto">Back</button>
                
                <div class="border-b py-1"></div>
                <div ref={state.myRef} className="landingpage-pickzone">
                {state.Tools && state.Tools.length > 0 &&  state.Tools.map((t) =>
                  <>
                    {t.Child && t.Child.length > 0 &&
                      <div className={`cus-not-draggable cursor-pointer hoverable hover:text-white py-2 landingpage-tool-` + t.Name}>
                        <div class="landingpage-tool-icon">
                          <img class="m-auto" src={t.Icon} />
                        </div>

                        <div class="-mt-12 mega-menu sm:mb-0 shadow-xl bg-white">
                          {t.Child.map((c) =>
                            <div className={`m-auto cursor-pointer float-left p-2 w-max`} data-id={`landingpage-tool-`+t.Name+`-`+ c.Name}>
                              <div class="landingpage-tool-icon">
                                <img class="m-auto" src={c.Icon} />
                              </div>
                            </div>
                          )}
                          <div class="clear-both"></div>
                        </div>
                      </div>
                    }

                    {!t.Child &&
                      <div className={`m-auto py-2 cursor-pointer`} data-id={`landingpage-tool-` + t.Name}>
                        <div class="landingpage-tool-icon">
                          <img class="m-auto" src={t.Icon} />
                        </div>
                      </div>
                    }
                  </>
                )}
                </div>
              </div>
            </div>

            <div dangerouslySetInnerHTML={{ __html: state.Content }} id="landingpage-content" class="min-h-screen col-span-11 bg-white border-t border-b sm:rounded sm:border shadow overflow-hidden">

            </div>
          </div>
        }
      </Layouttemplate>
    )

  }

  
}

