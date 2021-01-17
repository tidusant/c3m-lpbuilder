import Sidebar from './sidebar'
import PageTop from './pagetop'
import ScrollToTop from "react-scroll-up";
import { ToastContainer } from "react-toastify";
export default function Layout({ children }) {

    return <>
        <main className="ng-scope">
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <ba-sidebar>
                <Sidebar />
            </ba-sidebar>
            <page-top>

                <PageTop />
            </page-top>

            <div className="al-main">
                <div className="al-content">
                    {children}

                </div>
            </div>
            <footer className="al-footer clearfix">
                <div className="al-footer-right">Created with <i className="ion-heart"></i></div>
                <div className="al-footer-main clearfix">
                    <div className="al-copy">Blur Admin 2016</div>
                    <ul className="al-share clearfix">
                        <li><i className="socicon socicon-facebook"></i></li>
                        <li><i className="socicon socicon-twitter"></i></li>
                        <li><i className="socicon socicon-google"></i></li>
                        <li><i className="socicon socicon-github"></i></li>
                    </ul>
                </div>
            </footer>
            <back-top>
                <ScrollToTop showUnder={160}>
                    <i className="fa fa-angle-up back-top" id="backTop" title="Back to Top"></i>
                </ScrollToTop>
            </back-top>

        </main>

    </>
}
