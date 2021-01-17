import Link from 'next/link'

export default function Sidebar() {
    return <aside className="al-sidebar" >
    <ul className="al-sidebar-list" >
        <li  className="al-sidebar-list-item">
            <Link href="/index" >
                <a className="al-sidebar-list-link">
                    <i >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
</svg>
                    </i>
                    <span>Dashboard</span></a>
            </Link>
        </li>
        
        <li className="al-sidebar-list-item">
            <Link href="/logout" >
                <a className="al-sidebar-list-link">
                    
                <i>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
</svg>
</i>
                    <span>Logout</span></a>
            </Link>

        </li>
    </ul>
    <div className="sidebar-hover-elem"

         ></div>

    </aside>
  }