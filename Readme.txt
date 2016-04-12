Include the following lines at the appropriate locations in a web csproj file.



Put these settings among the other <ItemGroup> nodes...

  <ItemGroup>
    <Content Include="..\..\XanotechWeb\**\*.css">
      <Link>%(RecursiveDir)%(FileName)%(Extension)</Link>
    </Content>
    <Content Include="..\..\XanotechWeb\**\*.js">
      <Link>%(RecursiveDir)%(FileName)%(Extension)</Link>
    </Content>
    <Content Include="..\..\XanotechWeb\**\*.png">
      <Link>%(RecursiveDir)%(FileName)%(Extension)</Link>
    </Content>
  </ItemGroup>



Put these settings at the end of the csproj file right before the </Project> closer...

  <Target Name="CopyLinkedContentFiles" BeforeTargets="Build">
    <Copy SourceFiles="%(Content.Identity)"
          DestinationFiles="%(Content.Link)"
          SkipUnchangedFiles='true'
          OverwriteReadOnlyFiles='true'
          Condition="'%(Content.Link)' != ''" />
  </Target>
