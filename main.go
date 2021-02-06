package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/tidusant/c3m/common/c3mcommon"
	"github.com/tidusant/c3m/common/log"
	"github.com/tidusant/c3m/common/mycrypto"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"time"
	//"github.com/gin-gonic/contrib/static"
)

var (
	loaddatadone   bool
	layoutPath     = "./template/out"
	blankPath      = "./tplblank"
	schemeFolder   = "./scheme"
	templateFolder = "./templates"
	rootPath       = ""
	apiserver      string
)

func main() {
	initdata()
	if !loaddatadone {
		log.Errorf("Load data fail.")
		return
	}
	var port int
	var debug bool

	//check port
	rand.Seed(time.Now().Unix())
	port = 0
	for {
		port = rand.Intn(1024-1) + int(49151) + 1
		if c3mcommon.CheckPort(port) {
			break
		}
	}

	//fmt.Println(mycrypto.Encode("abc,efc", 5))
	flag.BoolVar(&debug, "debug", false, "Indicates if debug messages should be printed in log files")
	flag.Parse()

	logLevel := log.DebugLevel
	if !debug {
		layoutPath = "./layout"
		logLevel = log.InfoLevel
		gin.SetMode(gin.ReleaseMode)
		log.SetOutputFile(fmt.Sprintf("portal-"+strconv.Itoa(port)), logLevel)
		defer log.CloseOutputFile()
		log.RedirectStdOut()
	}
	log.Infof("debug %v", debug)

	//init config
	router := gin.Default()

	//http.Handle("/template/",  http.FileServer(http.Dir("./public")))

	router.POST("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "load template fail!")
	})
	router.POST("/getlocal", func(c *gin.Context) {
		rs := HandleGetLocal(c)
		b, _ := json.Marshal(rs)
		c.String(http.StatusOK, string(b))
	})
	//router.POST("/gettemplate", func(c *gin.Context) {
	//	rs:=HandleGetTemplate(c)
	//	b,_:=json.Marshal(rs)
	//	c.String(http.StatusOK, string(b))
	//})
	router.POST("/create", func(c *gin.Context) {
		rs := HandleCreateTemplate(c)
		b, _ := json.Marshal(rs)
		c.String(http.StatusOK, string(b))
	})
	router.POST("/submit", func(c *gin.Context) {
		rs := HandleSubmit(c)
		b, _ := json.Marshal(rs)
		c.String(http.StatusOK, string(b))
	})
	router.POST("/delete", func(c *gin.Context) {
		rs := HandleDeleteTemplate(c)
		b, _ := json.Marshal(rs)
		c.String(http.StatusOK, string(b))
	})

	//router.Use(static.Serve("/", static.LocalFile("static", false)))
	router.StaticFile("/", layoutPath+"/index.html")
	//nextjs request File
	router.Static("/_next", layoutPath+"/_next")
	router.Static("/fonts", layoutPath+"/fonts")
	router.Static("/images", layoutPath+"/images")
	router.Static("/templates", "./templates")
	router.Static("/scheme", "./scheme")
	router.StaticFile("/login", layoutPath+"/login.html")
	router.StaticFile("/index", layoutPath+"/index.html")
	//router.StaticFile("/edit", layoutPath+"/edit.html")
	//router.LoadHTMLGlob(layoutPath+"/edit.html")

	router.GET("/edit", HandleEditPage)

	//auto open browser to run when finish
	go func() {
		for {
			time.Sleep(time.Millisecond * 200)

			log.Debugf("Checking if started...")
			resp, err := http.Get("http://localhost:" + strconv.Itoa(port) + "/index/")
			if err != nil {
				log.Debugf("Failed:%s", err)
				continue
			}
			resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				log.Debugf("Not OK:%s", resp.StatusCode)
				continue
			}

			// Reached this point: server is up and running!
			break
		}
		log.Println("SERVER UP AND RUNNING!")
		open("http://localhost:" + strconv.Itoa(port) + "/index")
	}()

	log.Infof("running with port:" + strconv.Itoa(port))
	router.Run(":" + strconv.Itoa(port))

}

// open opens the specified URL in the default browser of the user.
func open(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}

	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}

func initdata() {
	apiserver = os.Getenv("API_ADD")
	if len(apiserver) < 10 {
		log.Error("Api ip INVALID")
		os.Exit(0)
	}
	log.Printf("check version...")

	log.Printf("load layout...")

	log.Printf("check folder...")

	//	var rt models.RequestResult
	//	json.Unmarshal([]byte(c3mcommon.RequestAPI(apiserver,"CreateSex|sf","")),&rt)
	//log.Debugf("test session:%+v",rt.Data)
	//	c3mcommon.RequestAPI(apiserver,"aut|sf",mycrypto.EncDat2(rt.Data)+"|i|orgid,orgname,userid,useremail")
	//log.Printf("test %s",mycrypto.DecodeOld(`NfEIIcwd9bNNgcJOFeyQxbJQiIiOiGdhRksIiI6SZnF2zVWTiiIk5WvZGI0mbg42pN3cllI6IivJncFCLx0iiMXd0GdTJy`,8))

	if _, err := os.Stat(templateFolder); err != nil {
		os.Mkdir(templateFolder, 755)
	}
	loaddatadone = true

	//test
	str := `AAHNBFZEgpY355YmtXTUJGTM4XRllNMwhev2cxm1BLRkMMXSZYImWFjElVXkdJk`
	test := mycrypto.Decode4(str)
	log.Debugf("test: %s", test)
	//if err!=nil{
	//	fmt.Errorf(err.Error())
	//}
	//log.Debug("test: "+test)
	//var lp models.LandingPage
	//err = json.Unmarshal([]byte(test), &lp)
	//if err != nil {
	//	log.Error(err.Error())
	//}

	//str := `{"status":1,"error":"","message":"","data":""}`
	//var rs models.RequestResult
	//err := json.Unmarshal([]byte(str), &rs)
	//
	//if err != nil {
	//	fmt.Println(err.Error())
	//} else {
	//	log.Debugf("%+v", rs)
	//}

}
