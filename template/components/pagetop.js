

export default function PageTop() {
    return <div className="page-top clearfix" >
    <a href="#/dashboard" className="al-logo clearfix"><span>LP</span>Builder</a>
    <a className="collapse-menu-link ion-navicon"> </a>


    <div className="user-profile clearfix">
        <div className="al-user-profile dropdown" >
            <a className="profile-toggle-link dropdown-toggle">
                <img src="/images/blur-admin/app/profile/Nasta.png" alt="" width="45" height="45"/>
            </a>
            <ul className="top-dropdown-menu profile-dropdown dropdown-menu" >
                <li><i className="dropdown-arr"></i></li>
                <li><a href="#/profile"><i className="fa fa-user"></i>Profile</a></li>
                <li><a><i className="fa fa-cog"></i>Settings</a></li>
                <li><a className="signout"><i className="fa fa-power-off"></i>Sign out</a></li>
            </ul>
        </div>
        <msg-center></msg-center>
    </div>
</div>
  }