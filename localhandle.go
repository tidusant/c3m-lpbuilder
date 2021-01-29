package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/tidusant/c3m/common/c3mcommon"
	"github.com/tidusant/c3m/repo/models"
	lpmodels "github.com/tidusant/c3mlp/repo/models"
	log "github.com/tidusant/chadmin-log"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"regexp"
	"strings"
)

type Template struct {
	Name string
	Path string
}
type Tool struct {
	Name    string
	Title   string
	Icon    string
	Content string
	Child   []Tool
}
type Nav struct {
	Id   string
	Name string
}

func HandleCreateTemplate(c *gin.Context) models.RequestResult {
	file, err := c.FormFile("file")
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}
	if file == nil {
		return models.RequestResult{Error: "Empty screenshot file"}
	}
	templatename, _ := c.GetPostForm("templatename")
	session, _ := c.GetPostForm("_s")
	if templatename == "" {
		return models.RequestResult{Error: "Empty Template Name"}
	}
	templates, err := GetTemplate(session)
	if err != nil {
		return models.RequestResult{Error: err.Error()}
	}
	//check duplicate
	for _, temp := range templates {
		if temp.Name == templatename {
			return models.RequestResult{Error: "Template Name is duplicated."}
		}
	}

	if err = CreateBlankTemplate(templatename, file); err != nil {
		log.Error(err)
		DeleteTemplate(templatename)
		return models.RequestResult{Error: "Something wrong."}
	}

	err = c.SaveUploadedFile(file, templatePath+"/"+templatename+"/screenshot.jpg")
	if err != nil {
		log.Error(err)
		DeleteTemplate(templatename)
		return models.RequestResult{Error: "Something wrong."}
	}

	templates = append(templates, lpmodels.Template{Name: templatename, Status: 0, Path: templatePath + "/" + templatename})
	b, _ := json.Marshal(templates)
	return models.RequestResult{Status: 1, Data: string(b)}
}
func CreateBlankTemplate(name string, file *multipart.FileHeader) error {

	path := templatePath + "/" + name
	os.Mkdir(path, 0755)
	os.Mkdir(path+"/css", 0755)
	os.Mkdir(path+"/js", 0755)
	os.Mkdir(path+"/images", 0755)
	os.Mkdir(path+"/itemicons", 0755)
	//copy default icon
	if _, err := os.Stat(blankPath + "/itemicons"); !os.IsNotExist(err) {
		items, _ := ioutil.ReadDir(blankPath + "/itemicons")
		for _, item := range items {
			if !item.IsDir() {
				input, err := ioutil.ReadFile(blankPath + "/itemicons/" + item.Name())
				if err != nil {
					return err
				}
				err = ioutil.WriteFile(path+"/itemicons/"+item.Name(), input, 0644)
				if err != nil {
					return err
				}
			}
		}
	}

	//creat item tool file
	d, err := ioutil.ReadFile(blankPath + "/items.html")
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(path+"/items.html", d, 0644)
	if err != nil {
		return err
	}
	//create layout content file
	d, err = ioutil.ReadFile(blankPath + "/content.html")
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(path+"/content.html", d, 0644)
	if err != nil {
		return err
	}

	//create navitem content file
	d, err = ioutil.ReadFile(blankPath + "/navitem.html")
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(path+"/navitem.html", d, 0644)
	if err != nil {
		return err
	}
	return nil
}

func HandleDeleteTemplate(c *gin.Context) models.RequestResult {
	params := c.PostForm("data")

	if params == "" {
		return models.RequestResult{Error: "Empty Template Name"}
	}
	DeleteTemplate(params)

	return models.RequestResult{Status: 1}
}
func DeleteTemplate(name string) {
	if name == "" {
		return
	}
	os.RemoveAll(templatePath + "/" + name)
}
func HandleEditPage(c *gin.Context) {

	name := c.Query("tpl")
	c.Writer.WriteHeader(http.StatusOK)
	gobackstr := `` //`<a href="/">Go back</a>`
	if name == "" {
		c.Writer.WriteString("Template name empty. " + gobackstr)
		return
	}

	//check template exist
	rootPath := templatePath + "/" + name
	if _, err := os.Stat(rootPath); os.IsNotExist(err) {

		c.Writer.WriteString("Template not found. " + gobackstr)
		return
	}

	//Get tool
	tools, err := ReadTemplateTool(rootPath)
	if err != nil {
		c.Writer.WriteString(err.Error() + gobackstr)
		return
	}
	//map tools name to replace in layout content
	mtool := make(map[string]string)
	toolcontent := ""
	trashel := `
<div class="landingpage-trash landingpage-cursor-pointer absolute top-0 hidden bg-opacity-0 z-30" onclick="RemoveItem(this)">
	<div class="bg-black text-white text-xs rounded py-2 px-4 mb-1 right-0 bottom-full">
      Remove item %s {{trashtitle}}     
    </div>
</div>`
	for _, v := range tools {
		if len(v.Child) > 0 {
			toolcontent += `
<div class="cus-not-draggable cursor-pointer hoverable hover:text-white py-2">
                        <div class="landingpage-tool-icon">
                          <img class="m-auto" src="` + v.Icon + `" title="` + v.Title + `" />
                        </div>

                        <div class="-mt-8 mega-menu sm:mb-0 shadow-xl bg-white">
`
			for _, v2 := range v.Child {
				toolkey := v.Name + "." + v2.Name
				mtool[toolkey] = v2.Content + fmt.Sprintf(trashel, v2.Title)
				toolcontent += `
<div class="m-auto cursor-pointer float-left p-2 w-max relative" lp-data-id="` + toolkey + `">
                              <div class="landingpage-tool-icon">
                                <img class="m-auto" src="` + v2.Icon + `" title="` + v2.Title + `" />
                              </div>
                            </div>
`
			}
			toolcontent += `<div class="clear-both"></div>
                        </div>
                      </div>`
		} else {

			mtool[v.Name] = v.Content + fmt.Sprintf(trashel, v.Title)
			toolcontent += `
<div class="m-auto py-2 cursor-pointer relative" lp-data-id="` + v.Name + `">
	<div class="landingpage-tool-icon">
	  <img class="m-auto" src="` + v.Icon + `" title="` + v.Title + `" />
	</div>
  </div>
`
		}
	}
	toolcontent = strings.Replace(toolcontent, "{{template_path}}", templatePath+"/"+name, -1)

	//get  layout content
	dat, err := ioutil.ReadFile(rootPath + "/content.html")
	if err != nil {
		c.Writer.WriteString(err.Error() + gobackstr)
		return
	}
	var navitems []Nav

	var re = regexp.MustCompile(`\{\{(.*)\}\}`)
	content := string(dat)
	t := re.FindAllStringSubmatch(content, -1)

	for _, v := range t {

		vtypes := strings.Split(v[1], "_")
		itemname := v[1]

		if len(vtypes) > 1 {
			itemname = vtypes[0]
		}
		if _, ok := mtool[itemname]; ok {
			//parse item type
			itemcontent := mtool[itemname]
			if itemname == "a" {
				itemcontent = strings.Replace(itemcontent, `{{Id}}`, vtypes[1], -1)
				itemcontent = strings.Replace(itemcontent, `{{trashtitle}}`, vtypes[2], -1)
				navitems = append(navitems, Nav{Id: vtypes[1], Name: vtypes[2]})
			} else {
				itemcontent = strings.Replace(itemcontent, `{{trashtitle}}`, "", -1)
			}

			content = strings.Replace(content, `{{`+v[1]+`}}`, `<div class="item-container m-auto landingpage-item-content relative" lp-data-id="`+v[1]+`">`+itemcontent+`</div>`, -1)
		}
	}

	//======================read and create edit page content============================
	dat, err = ioutil.ReadFile(schemePath + "/edit.html")
	if err != nil {
		c.Writer.WriteString(err.Error() + gobackstr)
		return
	}
	s := string(dat)

	//replace content
	s = strings.Replace(s, "{{toolcontent}}", toolcontent, 1)
	s = strings.Replace(s, "{{pagecontent}}", content, 1)

	b, _ := json.Marshal(mtool)

	s = strings.Replace(s, "{{mtoolcontent}}", string(b), 1)
	s = strings.Replace(s, "{{template_path}}", templatePath+"/"+name, -1)

	//============================nav item============================

	//read nav item template
	dat, err = ioutil.ReadFile(templatePath + "/" + name + "/navitem.html")
	if err != nil {
		c.Writer.WriteString(err.Error() + gobackstr)
		return
	}
	navtemplate := string(dat)
	navitemcontent := ``
	log.Debugf("%+v", navitems)
	for _, v := range navitems {
		navitemcontent += strings.Replace(strings.Replace(navtemplate, `{{Name}}`, v.Name, -1), `{{Id}}`, v.Id, -1)
	}
	//replace in content template
	s = strings.Replace(s, "{{navitems}}", navitemcontent, -1)

	//============== preview content in iframe
	//render css link
	customcss := `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`
	if _, err := os.Stat(rootPath + "/css"); err == nil {
		files, _ := ioutil.ReadDir(rootPath + "/css")
		for _, f := range files {
			if !f.IsDir() {
				customcss += `<link href="` + rootPath + `/css/` + f.Name() + `" rel="stylesheet">`
			}
		}
	}
	customcss += `<link href="/scheme/tailwind.css" rel="stylesheet">`
	s = strings.Replace(s, "{{customcss}}", customcss, -1)
	//render js script
	customjs := ``
	if _, err := os.Stat(rootPath + "/css"); err == nil {
		files, _ := ioutil.ReadDir(rootPath + "/js")
		for _, f := range files {
			if !f.IsDir() {
				customjs += `<script src="` + rootPath + `/js/` + f.Name() + `"></script>`
			}
		}
	}
	s = strings.Replace(s, "{{customjs}}", customjs, -1)
	s = strings.Replace(s, "{{customiframejs}}", strings.Replace(customjs, `</script>`, `<\/script>`, -1), -1)
	s = strings.Replace(s, "{{navitemtemplate}}", navitemcontent, -1)
	s = strings.Replace(s, "{{navitemtemplate}}", navitemcontent, -1)
	s = strings.Replace(s, "{{rootPath}}", rootPath, -1)
	// //Convert your cached html string to byte array
	// c.Writer.Write([]byte(result))
	c.Writer.WriteString(s)

}

func ReadTemplateTool(path string) ([]Tool, error) {
	var tools []Tool
	//read tool item
	file, err := os.Open(path + "/items.html")
	if err != nil {
		return tools, err
	}
	defer file.Close()

	// Start reading from the file with a reader.
	reader := bufio.NewReader(file)

	var tool Tool
	var child Tool
	var contentBuffer bytes.Buffer
	var line string
	for {
		line, err = reader.ReadString('\n')
		if err != nil {
			break
		}
		lineorg := strings.Trim(line, "\n")
		line = RemoveComment(lineorg)
		// Process the line here.
		if strings.Index(line, "#===") == 0 {
			//save content
			if child.Name != "" {
				child.Content = contentBuffer.String()
			} else {
				tool.Content = contentBuffer.String()
			}
			contentBuffer.Reset()
		}

		if line == "#===name===#" {
			//add previous data to tools

			if child.Name != "" {
				tool.Child = append(tool.Child, child)
				//new
				child = Tool{}
			}
			if tool.Name != "" {
				tools = append(tools, tool)
				//new
				tool = Tool{}
			}

			//read next line to get name
			line, err = reader.ReadString('\n')
			if err != nil {
				break
			}
			strs := strings.Split(RemoveComment(line), ":")

			//check name & icon
			if len(strs) < 3 {
				err = fmt.Errorf("name and icon invalid")
				break
			}

			tool.Name = strs[0]
			tool.Title = strs[1]
			tool.Icon = path + "/itemicons/" + strs[2]

		} else if line == "#===child===#" {
			if child.Name != "" {
				tool.Child = append(tool.Child, child)
				//new
				child = Tool{}
			}
			//read next line to get name
			line, err = reader.ReadString('\n')
			if err != nil {
				break
			}
			strs := strings.Split(RemoveComment(line), ":")

			//check name & icon
			if len(strs) < 3 {
				err = fmt.Errorf("name and icon invalid")
				break
			}

			child.Name = strs[0]
			child.Title = strs[1]
			child.Icon = path + "/itemicons/" + strs[2]
		} else {
			contentBuffer.WriteString(lineorg)
		}
		//===========
	}

	//add last item
	if child.Name != "" {
		child.Content = contentBuffer.String()
		tool.Child = append(tool.Child, child)
	}
	if tool.Name != "" {
		tool.Content = contentBuffer.String()
		tools = append(tools, tool)

	}

	if err != io.EOF {
		return tools, err
	}
	return tools, nil
}
func RemoveComment(s string) string {
	t := strings.Replace(s, `<!--`, ``, 1)
	t2 := strings.Replace(t, `-->`, ``, 1)

	return t2
}
func GetTemplate(session string) ([]lpmodels.Template, error) {
	var rt []lpmodels.Template
	localtemplates := make(map[string]string)
	if _, err := os.Stat(templatePath); err == nil {
		files, _ := ioutil.ReadDir(templatePath)
		for _, f := range files {
			if f.IsDir() {

				//check screen shot
				log.Debugf("check %s", templatePath+"/"+f.Name()+"/screenshot.jpg")
				if _, err := os.Stat(templatePath + "/" + f.Name() + "/screenshot.jpg"); err == nil {
					localtemplates[f.Name()] = f.Name()
				}
			}
		}
	}

	//get template form server
	bodystr := c3mcommon.RequestAPI(apiserver, "lptpl", session+"|la")
	var rs models.RequestResult
	err := json.Unmarshal([]byte(bodystr), &rs)
	if err != nil {
		return rt, err
	}
	if rs.Status != 1 {
		log.Debugf("rs %+v", rs)
		return rt, fmt.Errorf(rs.Error)
	}

	log.Debugf("rs template: %+v", rs)
	err = json.Unmarshal([]byte(rs.Data), &rt)
	if err != nil {
		return rt, err
	}
	for k, v := range rt {
		//hide templateID & userID
		rt[k].ID = primitive.NilObjectID
		rt[k].UserID = primitive.NilObjectID
		rt[k].Status = v.Status
		if v.Status != 1 {
			rt[k].Path = templatePath + "/" + v.Name
		}
		if _, ok := localtemplates[v.Name]; ok {
			delete(localtemplates, v.Name)
		}
	}

	//add local template into result
	for k, _ := range localtemplates {
		rt = append(rt, lpmodels.Template{Name: k, Status: 0, Path: templatePath + "/" + k})
	}

	return rt, nil
}
func HandleGetLocal(c *gin.Context) models.RequestResult {
	session := c.PostForm("data")
	templates, err := GetTemplate(session)
	if err != nil {
		errrs := models.RequestResult{Error: err.Error()}
		if err.Error() == "Session not found" {
			errrs.Status = -1
		}
		return errrs
	}
	b, _ := json.Marshal(templates)
	return models.RequestResult{Status: 1, Data: string(b)}
}
