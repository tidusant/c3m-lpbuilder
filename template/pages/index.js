
import Head from 'next/head'
import Layout from '../components/layout'
import Loading from '../components/loading'
import { checkAuth } from '../components/data'
import { useSelector, useDispatch } from 'react-redux'
import { useState } from 'react'
import axios from 'axios';
import Cookies from 'js-cookie'
import { GetData, GetDataLocal } from "../components/data";
import { toast } from "react-toastify";
import Modal from "react-bootstrap/Modal";

export default function Home() {
  const userstate = useSelector((state) => state)

  const [state, setState] = useState({
    isFirstCall: true,
    isLoading: false,
    nextAction: "get",
    file: "",
    templatename: "",
    modal: false,
    payload: {}
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
    const closeModal = () => {
      setState({ ...state, file: {}, templatename: "", modal: false })
    }
    const submitModal = () => {
      setState({ ...state, isLoading: true, nextAction: "create" })
    }
    const deleteTemplate = (tplName) => {

      var name = prompt("Are you sure delete \"" + tplName + "\" template? Type the template name to delete", "");
      name == tplName && setState({ ...state, isLoading: true, nextAction: "delete", payload: { name: tplName } })

    }
    const submitTemplate = (tplName) => {
      setState({ ...state, isLoading: true, nextAction: "submit", payload: { name: tplName } })

    }
    const resubmitTemplate = (tplName) => {
      setState({ ...state, isLoading: true, nextAction: "submit", payload: { name: tplName,re:true } })

    }
    //=========================


    if (userstate.username) {
      //=============other normal function here
      //check the page action, this will loop until page action is empty or error return    
      //and this is run only when isLoading=true
      //remember to set next action=empty or isloading=false to stop loop
      console.log(state);

      if (state.isLoading) {
        switch (state.nextAction) {
          case "get":
            GetDataLocal("getlocal", Cookies.get("_s")).then(rs => {
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
          case "submit":
            GetDataLocal("submit", Cookies.get("_s") + "|" + state.payload.name+(state.payload&&"|re")).then(rs => {
              if (rs.Status === 1) {
                //update template
                const tpls = []
                for (let i = 0, n = state.Templates.length; i < n; i++) {

                  if (state.Templates[i].Name == state.payload.name) {
                    state.Templates[i].Status = 2
                  }
                  tpls.push(state.Templates[i])

                }
                setState({ ...state, isLoading: false, nextAction: "", Templates: tpls })
                return

              } else {
                toast.error(rs.Error)
              }
              setState({ ...state, isLoading: false, nextAction: "" })
            })
            break;
          case "delete":
            GetDataLocal("delete", state.payload.name).then(rs => {
              console.log("data return", rs)
              if (rs.Status === 1) {
                try {

                  //remove template
                  const tpls = []
                  for (let i = 0, n = state.Templates.length; i < n; i++) {
                    if (state.Templates[i].Name != state.payload.name) {
                      tpls.push(state.Templates[i])
                    }
                  }
                  setState({ ...state, isLoading: false, nextAction: "", Templates: tpls })
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
            formData.append("_s", Cookies.get("_s"))
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
      <Layout>

        <Head>
          <title>C3M - Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {state.isLoading && <Loading />}

        <div className="row">


          <div className="col-md-12 col-sm-12">
            <div className="panel with-scroll animated zoomIn">
              <div className="panel-heading clearfix">
                <div class="float-left"><h3 className="panel-title">Working Template</h3></div>
                <div class="float-left -mt-3 ml-8"><button type="button" class="btn btn-sm btn-default" onClick={() => setState({ ...state, modal: true })}><i class="ion-plus"></i></button></div>
              </div>
              <div className="panel-body text-center">
                <div className="ng-scope">
                  {state.Templates && state.Templates.length > 0 && state.Templates.map((tpl) =>
                    <>
                      {tpl.Status != 1 &&
                        <div key={tpl.Name} className="mx-5 my-12 float-left">
                          <div className="userpic" onClick={() => { window.location = `/edit?tpl=${tpl.Name}` }}>
                            <div className="userpic-wrapper">
                              <img src={`/${tpl.Path}/screenshot.jpg`} />
                            </div>
                            {tpl.Status == 0 &&
                              <i onClick={e => { e.stopPropagation(); deleteTemplate(tpl.Name) }} className="ion-ios-close-outline ng-scope"></i>
                            }
                            <a href={`/edit?tpl=${tpl.Name}`} className="change-userpic" >{tpl.Name} </a>
                          </div>
                          {(tpl.Status == 0) &&
                            <button key={tpl.ID} type="button" onClick={() => submitTemplate(tpl.Name)} className="btn btn-default m-auto my-4">
                              Submit
                      </button>
                          }
                          {(tpl.Status == -1) &&
                            <>
                              <div className="py-2 text-red-500">{tpl.Description}</div>
                              <button key={tpl.ID} type="button" onClick={() => resubmitTemplate(tpl.Name)} className="btn btn-default m-auto my-4">
                                ReSubmit
                      </button>
                            </>
                          }
                          {(tpl.Status == 2) &&
                            <button key={tpl.ID} type="button" disabled="true" className="btn btn-default m-auto my-4">
                              Waiting approve
                      </button>
                          }


                        </div>
                      }
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>



          <div className="col-md-12 col-sm-12">
            <div className="panel with-scroll animated zoomIn">
              <div className="panel-heading clearfix">
                <div class="float-left"><h3 className="panel-title">Approved Template</h3></div>
              </div>
              <div className="panel-body text-center">
                <div className="ng-scope">
                  {state.Templates && state.Templates.length > 0 && state.Templates.map((tpl) =>
                    <>
                      {tpl.Status == 1 &&
                        <div key={tpl.Name} className="mx-5 my-12 float-left">
                          <div className="userpic" onClick={() => { window.location = `/edit?tpl=${tpl.Name}` }}>
                            <div className="userpic-wrapper">
                              <img src={`${process.env.NEXT_PUBLIC_TESTLP_URL}templates/${tpl.Path}/screenshot.jpg`} />
                            </div>

                            
                          </div>

                          {(tpl.Status == 1) &&
                            <>
                              <div class="py-2">
                                Viewed: {tpl.Viewed} - Installed: {tpl.Installed}
                              </div>

                            </>
                          }

                        </div>
                      }
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal show={state.modal} onHide={closeModal} animation={false} backdropClassName={"fade in"}
          className={"fade in"}>
          <Modal.Header className={"text-center"}>
            <span>New Template</span>
          </Modal.Header>
          <Modal.Body>
            <div class="input-group ng-scope">
              <span class="input-group-addon input-group-addon-primary addon-left" id="basic-addon1">@</span>
              <input type="text" class="form-control with-primary-addon" placeholder="Template Name" aria-describedby="basic-addon1"
                value={state.templatename}
                onChange={e => setState({ ...state, templatename: e.target.value })}
              />
            </div>
            <div class="input-group ng-scope">
              <input type="file" className="hidden templatefileinput" onChange={e => setState({ ...state, file: e.target.files[0] })} />
              <input type="text" className="form-control with-danger-addon" placeholder="Upload template screenshot"
                value={state.file.name}
              /> <span class="input-group-btn"><button onClick={e => { document.querySelector("input.templatefileinput").click() }} class="btn btn-danger" type="button">Browse file</button></span>
            </div>
            <div className={"text-center text-black"}>Change Status</div>

          </Modal.Body>
          <Modal.Footer>
            <button className={"btn btn-primary"} variant="secondary" onClick={submitModal}>
              Submit
                    </button>
            <button className={"btn btn-primary"} variant="secondary" onClick={closeModal}>
              Close
                    </button>

          </Modal.Footer>
        </Modal>
      </Layout>
    )

  }
}

