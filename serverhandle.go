package main

import (
	"archive/zip"
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/tidusant/c3m/common/c3mcommon"

	"github.com/tidusant/c3m/repo/models"
	"io/ioutil"
	"strings"

	"github.com/gin-gonic/gin"
	"io"
	"os"
	"path/filepath"
)

func HandleSubmitZipFile(c *gin.Context) models.RequestResult {
	name := c.PostForm("data")

	//var writer io.Writer
	//w := zip.NewWriter(writer)

	file, err := os.Create("templates/output.zip")
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}
	defer file.Close()

	w := zip.NewWriter(file)

	defer w.Close()

	walker := func(path string, info os.FileInfo, err error) error {
		fmt.Printf("Crawling: %#v\n", path)
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		// Ensure that `path` is not absolute; it should not start with "/".
		// This snippet happens to work because I don't use
		// absolute paths, but ensure your real-world code
		// transforms path into a zip-root relative path.
		f, err := w.Create(path)
		if err != nil {
			return err
		}

		_, err = io.Copy(f, file)
		if err != nil {
			return err
		}

		return nil
	}
	err = filepath.Walk(templatePath+"/"+name+"/", walker)
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}
	return models.RequestResult{Status: 1, Error: ""}
}

func HandleSubmit(c *gin.Context) models.RequestResult {
	args := strings.Split(c.PostForm("data"), "|")
	if len(args) < 2 {
		return models.RequestResult{Error: "something wrong"}
	}
	name := args[1]
	session := args[0]
	action := "s"
	if len(args) > 2 {
		action = args[2]
	}
	//var writer io.Writer
	//w := zip.NewWriter(writer)

	//file, err := os.Create("templates/output.zip")
	//if err != nil {
	//	return models.RequestResult{Error: err.Error()}
	//}
	//defer file.Close()
	//
	//w := zip.NewWriter(file)
	//
	//defer w.Close()

	mfile := make(map[string][]byte)

	walker := func(path string, info os.FileInfo, err error) error {
		fmt.Printf("Crawling: %#v\n", path)
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		b, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}
		mfile[strings.Replace(path, "templates/"+name+"/", "", 1)] = b
		return nil
	}
	err := filepath.Walk(templatePath+"/"+name+"/", walker)
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}

	// marshal and gzip
	bfile, err := json.Marshal(mfile)
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}
	var bb bytes.Buffer
	w := gzip.NewWriter(&bb)
	w.Write(bfile)
	w.Close()
	b64content := base64.StdEncoding.EncodeToString(bb.Bytes())

	bodystr := c3mcommon.RequestAPI(apiserver, "lptpl", session+"|"+action+"|"+name+","+b64content)
	var rs models.RequestResult
	err = json.Unmarshal([]byte(bodystr), &rs)
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}

	return rs
}
