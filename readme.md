### Building a landing page template
### Run at local
 env LPMIN_ADD=http://127.0.0.1:8090 API_ADD=http://127.0.0.1:8081 go run main.go localhandle.go serverhandle.go -debug=true

### structure:

- *css*: all css files will load in template
- images: all images file that used in template
- itemicons: all icon images use for drag&drop tool column
- js: all js file will load in template
- content.html : content in template
- items.html : drag&drop tool item template
- navitem.html: navigation item template the will render in content via token {{navitems}}
- screenshot.jpg

### instruction
- Template is build base on tailwindcss.com, the css will automatic include in the tool and will be purgecss in build time.
- Folder itemicons will not include in build time
- Consume item of items.html file in content.html by using token: {{\<itemid\>}}. Ex: {{title}}, {{price}}
- In items.html, items are create by syntax:

```<!--#===name===#-->```
   - this is the first line to declare a item

```<!--<id>:<Name>:<image.png>-->```
   - this is the second line that declare item id, item Name and item icon. The item icon must be in the folder **itemicons**
   - after this line, all the content will be the template of this item
   - if this item is a group of items, then the third line will be
  
```<!--#===child===#-->```
   - and the declare line (4th line) will be the same with the 2nd line.
   
- Continue create item or child item with the ```<!--#===name===#-->``` or ```<!--#===dhild===#-->``` line  

## Special item: Anchor link
- The special item - anchor link - is consumed by using syntax: {{a_\<anchorId\>_\<anchor Name\>}}. Ex: {{a-home-Home}}
- The tool will automatic collect all anchor items in content.html file and render them via token {{navitems}} by using template in navitem.html file
- In navitem.html, there are only 2 token: {{Id}} & {{Name}} match with \<anchorId\> and \<anchor Name\>. and the root tag must have attribute ```lp-data-id="landingpage-navitem-{{Id}}"``` to mark when delete an anchor. 
- This special item in items.html MUST NOT delete. If items.html file is missing this item, please add the following code at the begining of the file:
```<!--#===name===#-->
   <!--a:Anchor Link:anchor.png-->
   <a id="{{Id}}"></a><div class="element-not-editable">&nbsp;</div>
```
### note for js in template:
- if query by class: remember add class declare in css
- don't use popup modal with class "btnModal" 
- submit form MUST call serverSubmit() function after validation
- don't use inline event like onclick, onmouseenter ... to call js function
- use serverWindowLoad(evt){} function instead of window.onload = function(e) {} 
- function must have: 
    - showMessage(title,message,type)

### note for css in template:
- avoid same name with tailwind.css class name   
- all images must be in images folder

### note for contact form in template:
- form must have id="contact-me"
- input field name  must have id="name"
- input field phone  must have id="phone"
- input field email  must have id="email"
- input field message  must have id="message"
- must validate form before call  serverSubmit()


### run at local
env API_ADD=http://c3md.duyhf.com/api/ go run *.go -debug=true
env API_ADD=http://127.0.0.1:8081 go run *.go -debug=true 

### 