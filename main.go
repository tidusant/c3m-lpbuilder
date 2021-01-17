package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/tidusant/c3m/common/c3mcommon"
	"github.com/tidusant/c3m/common/log"
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
	loaddatadone bool
	layoutPath   = "./template/out"
	schemePath   = "./scheme"
	templatePath = "./templates"
	apiserver    string
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
	if _, err := os.Stat(templatePath); err != nil {
		os.Mkdir(templatePath, 755)
	}
	loaddatadone = true
}
