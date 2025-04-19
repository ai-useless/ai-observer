package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
)

type ChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type AIModelAPI struct {
	AIName    string
	Model     string
	APIURL    string
	UseAPIKey bool
	APIKey    string
}

var (
	APIURL = "https://llm.chutes.ai/v1/chat/completions"
	APIKey = "cpk_69adda47d49b4d51b3c6ae01f5449cdd.b167f56b3e8d5ffa88bf5cc6513bb6f4.1VTnR4OGz56pv1GlHG5OVDMdTrvSpLI5"
	// Model example
	// Model = "deepseek-ai/DeepSeek-V3-0324"
	// Model = "chutesai/Mistral-Small-3.1-24B-Instruct-2503"
	// Model = "cognitivecomputations/Dolphin3.0-Mistral-24B"
	// Model = "cognitivecomputations/Dolphin3.0-R1-Mistral-24B"
	// Model = "Qwen/Qwen2.5-VL-32B-Instruct"
	// Model = "open-r1/OlympicCoder-32B"
	// Model = "RekaAI/reka-flash-3"
	// Model = "deepseek-ai/DeepSeek-V3-Base"
)

func main() {
	// 添加CORS支持
	http.HandleFunc("/api/get-response", corsMiddleware(getResponseHandler))
	log.Println("Server started on :8091")
	log.Fatal(http.ListenAndServe(":8091", nil))
}

func getResponseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		AIName   string        `json:"ai"`
		Messages []ChatMessage `json:"messages"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Println("cur aiName: ", request.AIName)

	// fmt.Println("request.Messages: ", request.Messages)
	response, err := getAIResponse(request.AIName, request.Messages)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"content": processContent(response),
	})
}

func getAIResponse(aiModel string, messages []ChatMessage) (string, error) {
	reqBody, _ := json.Marshal(ChatRequest{
		Model:    aiModel,
		Messages: messages,
	})

	client := &http.Client{}
	req, err := http.NewRequest("POST", APIURL, strings.NewReader(string(reqBody)))
	if err != nil {
		fmt.Println("req err: ", err)
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("resp err: ", err)
		return "", err
	}
	defer resp.Body.Close()

	var response ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		fmt.Println("json err: ", err)
		return "", err
	}

	fmt.Println("response: ", response)
	return response.Choices[0].Message.Content, nil
}

func processContent(content string) string {
	// 处理<think>标签
	// content = strings.ReplaceAll(content, "<think>", "<div class='think'>")
	// content = strings.ReplaceAll(content, "</think>", "</div>")
	re := regexp.MustCompile(`<reasoning>[\s\S]*?</reasoning>`)
	content = re.ReplaceAllString(content, "")
	think := regexp.MustCompile(`<think>[\s\S]*?</think>`)
	content = think.ReplaceAllString(content, "")

	return content
}

// 添加CORS中间件
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}
