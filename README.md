# convert tistory article to mardown

tistory 블로그 게시글을 markdown 으로 변환 합니다

## Usage

### clone repository

```
git clone git@github.com:birariro/tistory_to_markdown.git && cd tistory_to_markdown
```

### install dependency

```
npm install axios jsdom turndown fs uuid dotenv
```

### '.env' 에 변환할 게시글 url 등록

```
urls = "
https://stopthe.world/78,
https://stopthe.world/77,
"
```

### '.env' 에 파싱 대상 테그의 클래스이름 등록

```
TITLE_TAG_CLASS_NAME = title_view
ARTICLE_TAG_CLASS_NAME = tt_article_useless_p_margin
```

### run

```
node tistory_to_markdown.js
```
